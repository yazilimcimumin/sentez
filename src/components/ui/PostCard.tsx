'use client';
import React, { useState } from 'react';
import { SocialPost } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface PostCardProps {
  post: SocialPost;
  onLike: (id: string) => void;
  onRepost: (id: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onRepost }) => {
  return (
    <article className={`bg-slate-900/80 border rounded-2xl p-5 shadow-xl transition-all ${
      post.isBridgeContent
        ? 'border-purple-500/40 bg-purple-950/10'
        : 'border-slate-800/80 hover:border-slate-700'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <img src={post.authorAvatar} alt={post.authorName}
            className="w-10 h-10 rounded-full object-cover border border-slate-700" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-100">{post.authorName}</h4>
              <span className="text-[11px] text-slate-400 font-mono">{post.authorHandle}</span>
            </div>
            <span className="text-[10px] text-slate-500">{post.timestamp}</span>
            {post.isBridgeContent && (
              <span className="ml-2 text-[10px] text-purple-400 font-semibold">🌉 Köprü İçerik</span>
            )}
          </div>
        </div>
        <StatusBadge
          status={post.badge.status}
          meritScore={post.badge.meritScore}
          botScore={post.badge.botScore}
          isClickbait={post.badge.isClickbait}
          isManipulatedMedia={post.badge.isManipulatedMedia}
          inferenceTimeMs={post.badge.inferenceTimeMs}
          contentSnippet={post.content.slice(0, 80)}
        />
      </div>

      <p className="text-xs text-slate-200 leading-relaxed mb-3 whitespace-pre-line">{post.content}</p>

      {post.mediaUrl && (
        <div className="relative mb-3 rounded-xl overflow-hidden border border-slate-800">
          <img src={post.mediaUrl} alt="Medya" className="w-full h-44 object-cover" />
          {post.badge.isManipulatedMedia && (
            <div className="absolute top-2 right-2 px-2.5 py-1 bg-rose-950/90 border border-rose-600 text-rose-300 rounded-lg text-[10px] font-mono backdrop-blur-sm">
              ⚠️ pHash: Tahrif Tespit Edildi (Hamming ≥10)
            </div>
          )}
          {!post.badge.isManipulatedMedia && post.mediaUrl && (
            <div className="absolute top-2 right-2 px-2.5 py-1 bg-emerald-950/90 border border-emerald-600 text-emerald-300 rounded-lg text-[10px] font-mono backdrop-blur-sm">
              ✓ pHash: Özgün Medya
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-slate-400 text-xs">
        <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
          ❤️ <span>{post.likes}</span>
        </button>
        <button onClick={() => onRepost(post.id)} className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
          🔄 <span>{post.reposts}</span>
        </button>
        <span className="flex items-center gap-1.5">💬 <span>{post.comments}</span></span>
        <span className="text-[10px] text-slate-500 font-mono">
          Topluluk #{post.communityId ?? 0} · {post.badge.inferenceTimeMs}ms
        </span>
      </div>
    </article>
  );
};
