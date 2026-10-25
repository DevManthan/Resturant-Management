import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Award,
  CheckCircle2,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { initialReviews } from '../data/mockData';

export default function CustomerReviewsView() {
  const [reviews, setReviews] = useState(initialReviews);
  const [filterRating, setFilterRating] = useState('ALL');

  const avgOverall = (
    reviews.reduce((acc, r) => acc + r.RATING, 0) / (reviews.length || 1)
  ).toFixed(1);
  const avgFood = (
    reviews.reduce((acc, r) => acc + r.FOOD_QUALITY, 0) / (reviews.length || 1)
  ).toFixed(1);
  const avgService = (
    reviews.reduce((acc, r) => acc + r.SERVICE, 0) / (reviews.length || 1)
  ).toFixed(1);

  const toggleDisplay = (reviewId) => {
    setReviews(
      reviews.map((r) =>
        r.REVIEW_ID === reviewId ? { ...r, DISPLAY_ON: !r.DISPLAY_ON } : r
      )
    );
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'ALL') return true;
    return r.RATING === parseInt(filterRating, 10);
  });

  return (
    <div className="space-y-6">
      {/* Sentiment KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Overall Guest Rating</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{avgOverall}</span>
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(avgOverall)
                      ? 'fill-amber-400 stroke-amber-500'
                      : 'stroke-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">From verified dine-in bills</span>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Culinary & Food Quality</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{avgFood}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Top 5% in Region
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Truffle Risotto & Sea Bass most praised</span>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase text-slate-400">Service & Floor Hospitality</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{avgService}</span>
            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
              Exceeds 4.5 SLA
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Digital waiter call response &lt; 2 mins</span>
        </div>
      </div>

      {/* Reviews Feed */}
      <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Guest Reviews & Feedback Feed</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Guest testimonials gathered automatically at post-payment split settlement.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium">
            {['ALL', '5', '4'].map((star) => (
              <button
                key={star}
                onClick={() => setFilterRating(star)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterRating === star
                    ? 'bg-brand-500 text-white font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                {star === 'ALL' ? 'All Ratings' : `${star} Stars`}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback List */}
        <div className="mt-6 space-y-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.REVIEW_ID}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/30 hover:bg-white hover:shadow-card transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 font-bold text-xs flex items-center justify-center">
                    {rev.CUSTOMER_NAME.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs">{rev.CUSTOMER_NAME}</span>
                      {rev.IS_ANONYMOUS && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded">
                          Anonymous
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Order #{rev.ORDER_ID} • {rev.REVIEW_DATE}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Star rating */}
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.RATING
                            ? 'fill-amber-400 stroke-amber-500'
                            : 'stroke-slate-300'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Public portal display toggle */}
                  <button
                    onClick={() => toggleDisplay(rev.REVIEW_ID)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
                      rev.DISPLAY_ON
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                    title="Toggle public showcase on mobile customer landing page"
                  >
                    {rev.DISPLAY_ON ? (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-700 leading-relaxed font-normal">
                "{rev.COMMENTS}"
              </p>

              <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
                <span>Food Quality: <strong className="text-slate-700">{rev.FOOD_QUALITY}/5</strong></span>
                <span>•</span>
                <span>Service Score: <strong className="text-slate-700">{rev.SERVICE}/5</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
