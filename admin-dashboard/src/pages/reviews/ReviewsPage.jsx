import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiStar, FiEyeOff, FiEye } from 'react-icons/fi';
import { Select, Badge, Button } from '../../components/FormControls';
import * as adminApi from '../../api/admin';
import { toastSuccess, toastError, confirmAction, apiErrorMessage } from '../../lib/alerts';

const Stars = ({ rating }) => (
  <div className="flex items-center gap-0.5 text-warning-500">
    {Array.from({ length: 5 }).map((_, i) => (
      <FiStar key={i} className={i < rating ? 'fill-current' : 'text-border'} />
    ))}
  </div>
);

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState('');
  const [isActive, setIsActive] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reviews-admin', rating, isActive],
    queryFn: () =>
      adminApi.listReviewsAdmin({ rating: rating || undefined, isActive: isActive || undefined, limit: 50 }),
  });

  const reviews = data?.data || [];

  const moderateMutation = useMutation({
    mutationFn: ({ id, value }) => adminApi.moderateReview(id, value),
    onSuccess: () => {
      toastSuccess('Review updated');
      queryClient.invalidateQueries({ queryKey: ['reviews-admin'] });
    },
    onError: (error) => toastError(apiErrorMessage(error, 'Failed to update review')),
  });

  const handleToggle = async (review) => {
    const willHide = review.isActive;
    const confirmed = await confirmAction({
      title: willHide ? 'Hide this review?' : 'Publish this review?',
      text: willHide
        ? 'The review will be hidden from the product page but kept on record.'
        : 'The review will become visible on the product page again.',
      confirmText: willHide ? 'Hide' : 'Publish',
      danger: willHide,
    });
    if (confirmed) moderateMutation.mutate({ id: review._id, value: !review.isActive });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-ink">Reviews</h1>
        <p className="text-ink-soft mt-1">Moderate customer product reviews</p>
      </div>

      <div className="bg-surface p-4 rounded-lg border border-border flex gap-4">
        <Select value={rating} onChange={(e) => setRating(e.target.value)} className="max-w-[160px]">
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} stars
            </option>
          ))}
        </Select>
        <Select value={isActive} onChange={(e) => setIsActive(e.target.value)} className="max-w-[160px]">
          <option value="">All statuses</option>
          <option value="true">Published</option>
          <option value="false">Hidden</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-ink-soft">Loading...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border p-12 text-center text-ink-soft">
          No reviews found
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review._id} className="bg-surface rounded-lg border border-border p-5 flex gap-4">
              <img
                src={review.product?.images?.[0]?.url || 'https://placehold.co/64x64'}
                alt={review.product?.name?.pt}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{review.product?.name?.pt}</p>
                    <p className="text-xs text-ink-soft">by {review.user?.name}</p>
                  </div>
                  <Badge color={review.isActive ? 'success' : 'danger'}>
                    {review.isActive ? 'Published' : 'Hidden'}
                  </Badge>
                </div>
                <Stars rating={review.rating} />
                {review.comment && <p className="text-sm text-ink-soft mt-2">{review.comment}</p>}
              </div>
              <Button
                variant={review.isActive ? 'danger' : 'secondary'}
                onClick={() => handleToggle(review)}
                className="self-center flex items-center gap-2 flex-shrink-0"
              >
                {review.isActive ? <FiEyeOff /> : <FiEye />} {review.isActive ? 'Hide' : 'Publish'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
