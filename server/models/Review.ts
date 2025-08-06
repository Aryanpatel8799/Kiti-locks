import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  verified: boolean; // Whether the user purchased the product
  helpful: number; // Number of helpful votes
  helpfulUsers: mongoose.Types.ObjectId[]; // Users who marked as helpful
  likes: mongoose.Types.ObjectId[]; // Users who liked this review
  reports: Array<{
    user: mongoose.Types.ObjectId;
    reason: string;
    reportedAt: Date;
  }>;
  images?: string[]; // Optional review images
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewModel extends Model<IReview> {
  calculateAverageRating(productId: mongoose.Types.ObjectId): Promise<{
    averageRating: number;
    totalReviews: number;
    distribution: { [key: number]: number };
  }>;
}

const reviewSchema = new Schema<IReview>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    helpfulUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reports: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reason: {
          type: String,
          required: true,
          trim: true,
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    images: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ rating: 1 });

// Static method to calculate average rating for a product
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating",
        },
      },
    },
  ]);

  if (stats.length > 0) {
    const { averageRating, totalReviews, ratingDistribution } = stats[0];

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((rating: number) => {
      distribution[rating as keyof typeof distribution]++;
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      distribution,
    };
  }

  return {
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
};

// Update product's rating stats after review changes
reviewSchema.post("save", async function () {
  const Review = this.constructor as any;
  const Product = mongoose.model("Product");

  const stats = await Review.calculateAverageRating(this.product);

  await Product.findByIdAndUpdate(this.product, {
    averageRating: stats.averageRating,
    reviewCount: stats.totalReviews,
    ratingDistribution: stats.distribution,
  });
});

reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    const Review = mongoose.model("Review") as IReviewModel;
    const Product = mongoose.model("Product");

    const stats = await Review.calculateAverageRating(doc.product);

    await Product.findByIdAndUpdate(doc.product, {
      averageRating: stats.averageRating,
      reviewCount: stats.totalReviews,
      ratingDistribution: stats.distribution,
    });
  }
});

const Review = (mongoose.models.Review || 
  mongoose.model<IReview, IReviewModel>("Review", reviewSchema)) as IReviewModel;
export default Review;
