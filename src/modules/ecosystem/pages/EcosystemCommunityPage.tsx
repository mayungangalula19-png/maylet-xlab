import CreatePostModal from '../components/community/CreatePostModal';
import DiscoverySidebar from '../components/community/DiscoverySidebar';
import FeedFiltersSidebar from '../components/community/FeedFiltersSidebar';
import FeedList from '../components/community/FeedList';
import { useCommunityFeed } from '../hooks/useCommunityFeed';
import './ecosystem-community.css';

export default function EcosystemCommunityPage() {
  const feed = useCommunityFeed();

  return (
    <div className="mxl-comm">
      <header className="mxl-comm__header">
        <div>
          <h1>Ecosystem Community Feed</h1>
          <p>
            Hybrid intelligence network for Maylet X Lab — research sharing, project signals, and
            collaboration discovery.
          </p>
        </div>
        <button type="button" className="mxl-comm__btn-primary" onClick={feed.openComposer}>
          Create post
        </button>
      </header>

      <div className="mxl-comm__grid">
        <FeedFiltersSidebar filter={feed.filter} onFilterChange={feed.setFilter} />

        <FeedList
          posts={feed.posts}
          filter={feed.filter}
          sort={feed.sort}
          loading={feed.loading}
          loadingMore={feed.loadingMore}
          likedIds={feed.likedIds}
          savedIds={feed.savedIds}
          comments={feed.comments}
          openComments={feed.openComments}
          onLike={feed.handleLike}
          onShare={feed.handleShare}
          onSave={feed.handleSave}
          onToggleComments={feed.toggleComments}
          onComment={feed.handleComment}
          onCollaboration={feed.handleCollaboration}
          onLoadMore={feed.loadMore}
          onOpenComposer={feed.openComposer}
          onSortChange={feed.setSort}
        />

        <DiscoverySidebar trending={feed.trending} suggestions={feed.suggestions} />
      </div>

      {feed.modalOpen ? (
        <CreatePostModal
          onClose={() => feed.setModalOpen(false)}
          onSubmit={feed.handleCreatePost}
          posting={feed.posting}
          error={feed.postError}
        />
      ) : null}

      <style>{`.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }`}</style>
    </div>
  );
}
