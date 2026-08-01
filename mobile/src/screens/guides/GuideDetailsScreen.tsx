import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { getGuideById } from '../../data/preparednessGuides';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

type RouteParams = {
  GuideDetails: {
    guideId: number;
  };
};

export const GuideDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'GuideDetails'>>();
  const { guideId } = route.params;
  const guide = getGuideById(guideId);

  if (!guide) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Guide not found</Text>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      let shareText = `${guide.title}\n\n${guide.description}\n\n`;
      
      guide.content.forEach(section => {
        shareText += `${section.heading}:\n`;
        section.items.forEach((item, index) => {
          shareText += `${index + 1}. ${item}\n`;
        });
        shareText += '\n';
      });

      shareText += '\nShared from SafeHaven App';

      await Share.share({
        message: shareText,
        title: guide.title,
      });
    } catch (error) {
      console.error('Error sharing guide:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>{guide.icon}</Text>
        <Text style={styles.title}>{guide.title}</Text>
        <Text style={styles.description}>{guide.description}</Text>
        
        <View style={styles.meta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{guide.category.toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={COLORS.primary} />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Sections */}
      {guide.content.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>{sectionIndex + 1}</Text>
            </View>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
          </View>

          <View style={styles.itemsList}>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.item}>
                <View style={styles.bullet}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                </View>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="information-circle" size={20} color={COLORS.textSecondary} />
        <Text style={styles.footerText}>
          Last updated: {new Date(guide.lastUpdated).toLocaleDateString()}
        </Text>
      </View>

      {/* Important Notice */}
      <View style={styles.notice}>
        <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
        <Text style={styles.noticeText}>
          This guide provides general information. Always follow official instructions from local authorities during emergencies.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.error,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  sectionNumberText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  sectionHeading: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
  },
  itemsList: {
    gap: SPACING.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  itemText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  footerText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  notice: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#92400E',
    lineHeight: 20,
  },
});
