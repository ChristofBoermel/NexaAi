// Feed screen: swipeable deck of pending job matches.
// - Right swipe = 'like', Left swipe = 'pass'
// - Tap opens the JobDetailModal
// - Realtime listener navigates to /match/[id] on mutual match

import { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Swiper from 'react-native-deck-swiper'

import {
  setSeekerDecision,
  useMutualMatchListener,
  useOpenMatches,
  type MatchWithJob,
} from '@/lib/jobs'
import { EmptyFeed } from '@/components/feed/empty-feed'
import { JobCard } from '@/components/feed/job-card'
import { JobDetailModal } from '@/components/feed/job-detail-modal'
import { CvSkeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'

export default function Feed() {
  const router = useRouter()
  const { items, isLoading, refetch } = useOpenMatches()
  const [detailMatch, setDetailMatch] = useState<MatchWithJob | null>(null)

  const onNewMutual = useCallback(
    (matchId: string) => {
      router.push(`/(app)/match/${matchId}`)
    },
    [router],
  )

  useMutualMatchListener(onNewMutual)

  const decide = useCallback(
    async (matchId: string, decision: 'like' | 'pass') => {
      await setSeekerDecision(matchId, decision)
    },
    [],
  )

  const cards = useMemo(() => items, [items])

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 py-6">
          <CvSkeleton />
        </View>
      </SafeAreaView>
    )
  }

  if (cards.length === 0) {
    return <EmptyFeed />
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-50">
      <View className="items-center px-6 py-3">
        <Text variant="muted">
          {`${cards.length} passende ${cards.length === 1 ? 'Stelle' : 'Stellen'}`}
        </Text>
      </View>
      <View className="flex-1">
        <Swiper<MatchWithJob>
          cards={cards}
          renderCard={(card) =>
            card ? (
              <JobCard match={card} onTap={() => setDetailMatch(card)} />
            ) : (
              <View />
            )
          }
          keyExtractor={(card) => card.id}
          onSwipedLeft={(index) => {
            const target = cards[index]
            if (target) decide(target.id, 'pass')
          }}
          onSwipedRight={(index) => {
            const target = cards[index]
            if (target) decide(target.id, 'like')
          }}
          onSwipedAll={() => {
            refetch()
          }}
          verticalSwipe={false}
          backgroundColor="transparent"
          stackSize={3}
          cardVerticalMargin={16}
          cardHorizontalMargin={24}
          animateOverlayLabelsOpacity
          overlayLabels={{
            left: {
              title: 'PASS',
              style: {
                label: {
                  backgroundColor: '#DC2626',
                  color: 'white',
                  fontSize: 24,
                  padding: 12,
                  borderRadius: 12,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: 40,
                  marginLeft: -20,
                },
              },
            },
            right: {
              title: 'INTERESSE',
              style: {
                label: {
                  backgroundColor: '#0E3652',
                  color: 'white',
                  fontSize: 24,
                  padding: 12,
                  borderRadius: 12,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: 40,
                  marginLeft: 20,
                },
              },
            },
          }}
        />
      </View>

      <JobDetailModal
        match={detailMatch}
        onDismiss={() => setDetailMatch(null)}
        onLike={() => {
          if (detailMatch) {
            decide(detailMatch.id, 'like')
            setDetailMatch(null)
          }
        }}
        onPass={() => {
          if (detailMatch) {
            decide(detailMatch.id, 'pass')
            setDetailMatch(null)
          }
        }}
      />
    </SafeAreaView>
  )
}
