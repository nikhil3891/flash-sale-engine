import type { PipelineStage } from "mongoose";
import { Order } from "../order/order.model";

export type DashboardPayload = {
  revenueAndVolume: {
    totalRevenue: number;
    totalItemsSold: number;
  };
  topCategories: { _id: string | null; revenue: number }[];
  conversionSpeed: { avgConversionTime: number | null };
  stockHealth: {
    criticalStock: { _id: unknown; name?: string; stock?: number; category?: string }[];
    healthyStock: { _id: unknown; name?: string; stock?: number; category?: string }[];
  };
};

/**
 * One aggregate() call. MongoDB forbids $facet inside $facet, so all branches are
 * parallel under a single top-level $facet (each branch is a linear pipeline).
 */
export const getDashboard = async (): Promise<DashboardPayload> => {
  const pipeline = [
    {
      $facet: {
        revenueAndVolume: [
          {
            $lookup: {
              from: "products",
              localField: "productId",
              foreignField: "_id",
              as: "product"
            }
          },
          { $unwind: "$product" },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$price" },
              totalItemsSold: { $sum: 1 }
            }
          }
        ],
        topCategories: [
          {
            $lookup: {
              from: "products",
              localField: "productId",
              foreignField: "_id",
              as: "product"
            }
          },
          { $unwind: "$product" },
          {
            $group: {
              _id: "$product.category",
              revenue: { $sum: "$price" }
            }
          },
          { $sort: { revenue: -1 } },
          { $limit: 3 }
        ],
        conversionSpeed: [
          {
            $lookup: {
              from: "products",
              localField: "productId",
              foreignField: "_id",
              as: "product"
            }
          },
          { $unwind: "$product" },
          {
            $group: {
              _id: "$productId",
              firstOrderTime: { $min: "$createdAt" },
              saleStartTime: { $first: "$product.saleStartTime" }
            }
          },
          {
            $project: {
              diff: {
                $subtract: ["$firstOrderTime", "$saleStartTime"]
              }
            }
          },
          {
            $group: {
              _id: null,
              avgConversionTime: { $avg: "$diff" }
            }
          }
        ],
        criticalStock: [
          { $group: { _id: null } },
          {
            $lookup: {
              from: "products",
              pipeline: [
                { $match: { stock: { $lt: 10 } } },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    stock: 1,
                    category: 1
                  }
                }
              ],
              as: "criticalStock"
            }
          }
        ],
        healthyStock: [
          { $group: { _id: null } },
          {
            $lookup: {
              from: "products",
              pipeline: [
                { $match: { stock: { $gte: 10 } } },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    stock: 1,
                    category: 1
                  }
                }
              ],
              as: "healthyStock"
            }
          }
        ]
      }
    }
  ] as PipelineStage[];

  const [raw] = await Order.aggregate(pipeline);

  const rv = raw?.revenueAndVolume?.[0];
  const conv = raw?.conversionSpeed?.[0];
  const critDoc = raw?.criticalStock?.[0] as
    | { criticalStock?: DashboardPayload["stockHealth"]["criticalStock"] }
    | undefined;
  const healthDoc = raw?.healthyStock?.[0] as
    | { healthyStock?: DashboardPayload["stockHealth"]["healthyStock"] }
    | undefined;

  return {
    revenueAndVolume: {
      totalRevenue: rv?.totalRevenue ?? 0,
      totalItemsSold: rv?.totalItemsSold ?? 0
    },
    topCategories: raw?.topCategories ?? [],
    conversionSpeed: {
      avgConversionTime:
        conv?.avgConversionTime !== undefined && conv?.avgConversionTime !== null
          ? conv.avgConversionTime
          : null
    },
    stockHealth: {
      criticalStock: critDoc?.criticalStock ?? [],
      healthyStock: healthDoc?.healthyStock ?? []
    }
  };
};
