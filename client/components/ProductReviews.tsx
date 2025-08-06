import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Star, ThumbsUp, Heart, Flag, User, Calendar, CheckCircle, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Review {
  _id: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  userMarkedHelpful: boolean;
  likes: number;
  userLiked: boolean;
  reports: number;
  userReported: boolean;
  images?: string[];
  createdAt: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export default function ProductReviews({
  productId,
  productName,
}: ProductReviewsProps) {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [filterRating, setFilterRating] = useState("all");
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  });

  useEffect(() => {
    fetchReviews();
  }, [productId, sortBy, filterRating]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sort: sortBy,
        ...(filterRating !== "all" && { rating: filterRating }),
      });

      const response = await fetch(
        `/api/reviews/product/${productId}?${params}`,
      );

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setStats(
          data.stats || {
            averageRating: 0,
            totalReviews: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
        );
      } else {
        console.error("Reviews API response not ok:", response.status);
        // Set empty state on error
        setReviews([]);
        setStats({
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Set empty state on error
      setReviews([]);
      setStats({
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to write a review");
      return;
    }

    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          productId,
          ...reviewForm,
        }),
      });

      if (response.ok) {
        toast.success("Review submitted successfully!");
        setShowReviewDialog(false);
        setReviewForm({ rating: 5, title: "", comment: "" });
        fetchReviews(); // Refresh reviews
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to submit review");
      }
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to mark reviews as helpful");
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            review._id === reviewId
              ? {
                  ...review,
                  helpful: data.helpful,
                  userMarkedHelpful: data.userMarkedHelpful,
                }
              : review,
          ),
        );
      }
    } catch (error) {
      toast.error("Failed to update helpful status");
    }
  };

  const handleLike = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to like reviews");
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            review._id === reviewId
              ? {
                  ...review,
                  likes: data.likes,
                  userLiked: data.userLiked,
                }
              : review,
          ),
        );
      }
    } catch (error) {
      toast.error("Failed to update like status");
    }
  };

  const handleReport = async (reviewId: string, reason: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to report reviews");
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        const data = await response.json();
        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            review._id === reviewId
              ? {
                  ...review,
                  reports: data.reports,
                  userReported: data.userReported,
                }
              : review,
          ),
        );
        toast.success("Review reported successfully");
      }
    } catch (error) {
      toast.error("Failed to report review");
    }
  };

  const renderStars = (rating: number, size = "w-4 h-4") => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingInput = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-6 h-6 ${
                star <= reviewForm.rating
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300 hover:text-yellow-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-slate-600">
          {reviewForm.rating} star{reviewForm.rating !== 1 ? "s" : ""}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              {renderStars(Math.round(stats.averageRating), "w-5 h-5")}
              <p className="text-sm text-slate-600 mt-2">
                Based on {stats.totalReviews} review
                {stats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count =
                  stats.distribution[rating as keyof typeof stats.distribution];
                const percentage =
                  stats.totalReviews > 0
                    ? (count / stats.totalReviews) * 100
                    : 0;

                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-12">{rating} star</span>
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Write Review Button */}
          <div className="mt-6 text-center">
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
              <DialogTrigger asChild>
                <Button>Write a Review</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Write a Review for {productName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Rating</Label>
                    {renderRatingInput()}
                  </div>
                  <div>
                    <Label htmlFor="review-title">Review Title</Label>
                    <Input
                      id="review-title"
                      placeholder="Summarize your experience"
                      value={reviewForm.title}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="review-comment">Review</Label>
                    <Textarea
                      id="review-comment"
                      placeholder="Tell others about your experience with this product"
                      rows={4}
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          comment: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitReview} disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Label>Sort by:</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label>Filter by rating:</Label>
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="5">5 stars</SelectItem>
              <SelectItem value="4">4 stars</SelectItem>
              <SelectItem value="3">3 stars</SelectItem>
              <SelectItem value="2">2 stars</SelectItem>
              <SelectItem value="1">1 star</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review, index) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={review.user.avatar}
                        alt={review.user.name}
                      />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {review.user.name}
                          </span>
                          {review.verified && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-green-100 text-green-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="font-medium">{review.title}</span>
                      </div>

                      <p className="text-slate-700 leading-relaxed">
                        {review.comment}
                      </p>

                      {/* Review Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {review.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Review image ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-md cursor-pointer hover:opacity-80"
                              onClick={() => window.open(image, '_blank')}
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-slate-600 hover:text-blue-600 ${
                              review.userMarkedHelpful ? "text-blue-600" : ""
                            }`}
                            onClick={() => handleHelpful(review._id)}
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Helpful ({review.helpful})
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-slate-600 hover:text-red-600 ${
                              review.userLiked ? "text-red-600" : ""
                            }`}
                            onClick={() => handleLike(review._id)}
                          >
                            <Heart className={`w-4 h-4 mr-1 ${review.userLiked ? "fill-current" : ""}`} />
                            Like ({review.likes})
                          </Button>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-600">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {!review.userReported ? (
                              <>
                                <DropdownMenuItem onClick={() => handleReport(review._id, "spam")}>
                                  <Flag className="w-4 h-4 mr-2" />
                                  Report as Spam
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReport(review._id, "inappropriate")}>
                                  <Flag className="w-4 h-4 mr-2" />
                                  Report as Inappropriate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReport(review._id, "fake")}>
                                  <Flag className="w-4 h-4 mr-2" />
                                  Report as Fake
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem disabled>
                                <Flag className="w-4 h-4 mr-2" />
                                Already Reported
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-600">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </div>
    </div>
  );
}
