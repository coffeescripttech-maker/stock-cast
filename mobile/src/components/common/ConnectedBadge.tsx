/**
 * ConnectedBadge - Badge component connected to BadgeContext
 * 
 * This component automatically subscribes to badge count updates
 * for a specific location and renders the BadgeIndicator accordingly.
 */

import React from 'react';
import { ViewStyle } from 'react-native';
import BadgeIndicator, { BadgeIndicatorProps } from './BadgeIndicator';
import { useBadgeCounter } from '../../store/BadgeContext';
import { BadgeLocation } from '../../services/notifications/BadgeCounterService';

interface ConnectedBadgeProps extends Omit<BadgeIndicatorProps, 'count'> {
  location: BadgeLocation;
}

const ConnectedBadge: React.FC<ConnectedBadgeProps> = ({
  location,
  ...badgeProps
}) => {
  const { badgeCounts } = useBadgeCounter();
  const count = badgeCounts[location];

  return (
    <BadgeIndicator
      count={count}
      testID={`connected-badge-${location}`}
      {...badgeProps}
    />
  );
};

export default ConnectedBadge;