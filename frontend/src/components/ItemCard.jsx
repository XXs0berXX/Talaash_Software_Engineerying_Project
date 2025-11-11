/**
 * ItemCard Component
 * Displays found or lost item details in a card format
 */

import React from 'react';

export default function ItemCard({
  item,
  type = 'found', // 'found' or 'lost'
  onClaimClick,
  showClaimButton = true,
}) {
  const statusColors = {
    pending: 'bg-warning',
    approved: 'bg-success',
    claimed: 'bg-primary',
    found: 'bg-success',
  };

  const dateField = type === 'found' ? 'date_found' : 'date_lost';
  const itemDate = new Date(item[dateField]);

  return (
    <div className="card w-full">
      {/* Image */}
      {item.image_url && (
        <img
          src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${item.image_url}`}
          alt={item.description}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-dark line-clamp-2">
          {item.description}
        </h3>
        <span
          className={`${statusColors[item.status] || 'bg-gray-400'} text-white text-xs px-3 py-1 rounded-full`}
        >
          {item.status}
        </span>
      </div>

      {/* Location */}
      <div className="mb-2">
        <p className="text-sm text-gray-600">
          <strong>📍 Location:</strong> {item.location}
        </p>
      </div>

      {/* Date */}
      <div className="mb-3">
        <p className="text-sm text-gray-600">
          <strong>📅 {type === 'found' ? 'Found' : 'Lost'}:</strong>{' '}
          {itemDate.toLocaleDateString()} {itemDate.toLocaleTimeString()}
        </p>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm line-clamp-3">
          {item.description}
        </p>
      </div>

      {/* Actions */}
      {showClaimButton && item.status === 'approved' && (
        <button
          onClick={() => onClaimClick?.(item.id)}
          className="btn-primary w-full"
        >
          {type === 'found' ? 'Claim Item' : 'Report Found'}
        </button>
      )}
    </div>
  );
}
