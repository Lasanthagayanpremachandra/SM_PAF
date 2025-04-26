import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'timeago.js';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { deletePost } from '../api/apiCalls';
import Modal from './Modal';
import { useApiProgress } from '../shared/ApiProgress';
import ProfileImageWithDefault from './ProfileImageWithDefault';
import axios from 'axios';

const PostView = props => {
    const { t } = useTranslation();
    const { post, onDeletePost } = props;
    const loggedInUser = useSelector(store => store.username);
    const { isLoggedIn } = useSelector(store => ({ isLoggedIn: store.isLoggedIn }));
    const { user, content, timestamp, id, fileAttachment } = post;
    const { username, displayName, profileImage } = user;

    // State variables
    const [modalVisible, setModalVisible] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [shareCount, setShareCount] = useState(0);
    const [userLiked, setUserLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [shareUrl, setShareUrl] = useState('');
    const [showEmojis, setShowEmojis] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);

    const { i18n } = useTranslation();

    // API progress indicators
    const pendingApiCall = useApiProgress('delete', `/api/1.0/posts/${id}`, true);
    const pendingLikeApiCall = useApiProgress('post', `/api/1.0/posts/${id}/like`, true);
    const pendingUnlikeApiCall = useApiProgress('delete', `/api/1.0/posts/${id}/like`, true);
    const pendingCommentApiCall = useApiProgress('post', `/api/1.0/posts/${id}/comments`, true);
    const pendingShareApiCall = useApiProgress('post', `/api/1.0/posts/${id}/share`, true);

    // Emojis for reactions
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

    // Function to fetch likes count
    const fetchLikesCount = async () => {
        try {
            const response = await axios.get(`/api/1.0/posts/${id}/likes`);
            setLikeCount(response.data.length);

            // Check if current user has liked this post
            if (isLoggedIn && response.data) {
                const userHasLiked = response.data.some(like => like.username === loggedInUser);
                setUserLiked(userHasLiked);
            }
        } catch (error) {
            console.error("Error loading likes:", error);
        }
    };

    // Function to fetch shares count
    const fetchSharesCount = async () => {
        try {
            const response = await axios.get(`/api/1.0/posts/${id}/shares`);
            setShareCount(response.data.count);
        } catch (error) {
            console.error("Error loading shares count:", error);
        }
    };

    // Function to fetch comments
    const fetchComments = async () => {
        try {
            const response = await axios.get(`/api/1.0/posts/${id}/comments`);
            setComments(response.data);
        } catch (error) {
            console.error("Error loading comments:", error);
        }
    };

    useEffect(() => {
        fetchLikesCount();
        fetchSharesCount();
        // Initialize share URL
        setShareUrl(`${window.location.origin}/posts/${id}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isLoggedIn]);

    const onClickDelete = async () => {
        try {
            await deletePost(id);
            onDeletePost(id);
        } catch (error) {
            console.error("Error deleting post:", error);
        } finally {
            setModalVisible(false);
        }
    };

    const onClickCancel = () => {
        setModalVisible(false);
    };

    const handleLikeClick = async () => {
        if (!isLoggedIn) return;

        try {
            if (userLiked) {
                await axios.delete(`/api/1.0/posts/${id}/like`);
                setUserLiked(false);
                setLikeCount(prevCount => Math.max(0, prevCount - 1));
            } else {
                await axios.post(`/api/1.0/posts/${id}/like`);
                setUserLiked(true);
                setLikeCount(prevCount => prevCount + 1);
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            fetchLikesCount();
        }
    };

    const handleEmojiReact = async (emoji) => {
        if (!isLoggedIn) return;

        try {
            await axios.post(`/api/1.0/posts/${id}/react`, { emoji });
            // Refresh likes after reaction
            fetchLikesCount();
            setShowEmojis(false);
        } catch (error) {
            console.error("Error reacting with emoji:", error);
        }
    };

    const handleCommentClick = () => {
        setShowComments(!showComments);
        if (!showComments) {
            fetchComments();
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const payload = { content: newComment };
            if (replyTo) {
                payload.replyToId = replyTo.id;
            }

            await axios.post(`/api/1.0/posts/${id}/comments`, payload);
            setNewComment('');
            setReplyTo(null);
            fetchComments();
        } catch (error) {
            console.error("Error submitting comment:", error);
        }
    };

    const handleReplyClick = (comment) => {
        setReplyTo(comment);
        // Focus on comment input
        document.getElementById('commentInput').focus();
    };

    const handleCancelReply = () => {
        setReplyTo(null);
    };

    const recordShareAction = async (platform) => {
        if (isLoggedIn) {
            try {
                await axios.post(`/api/1.0/posts/${id}/share`, { platform });
                setShareCount(prevCount => prevCount + 1);
            } catch (error) {
                console.error("Error recording share:", error);
            }
        }
    };

    const handleSharePost = async (platform) => {
        let shareLink;
        const text = `Check out this post: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`;

        try {
            switch (platform) {
                case 'facebook':
                    shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                    break;
                case 'twitter':
                    shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
                    break;
                case 'linkedin':
                    shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
                    break;
                case 'email':
                    shareLink = `mailto:?subject=Check out this post&body=${encodeURIComponent(text + '\n\n' + shareUrl)}`;
                    break;
                case 'copy':
                    try {
                        await navigator.clipboard.writeText(shareUrl);
                        setShareSuccess(true);
                        setTimeout(() => setShareSuccess(false), 3000);
                        recordShareAction('clipboard');
                        return;
                    } catch (err) {
                        console.error('Failed to copy: ', err);
                    }
                    break;
                case 'whatsapp':
                    shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
                    break;
                case 'telegram':
                    shareLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
                    break;
                default:
                    break;
            }

            if (shareLink) {
                window.open(shareLink, '_blank');
                recordShareAction(platform);
            }
        } catch (error) {
            console.error("Error sharing post:", error);
        }
    };

    const formatted = format(timestamp, i18n.language);
    const ownedByLoggedInUser = loggedInUser === username;
    const pendingLikeAction = pendingLikeApiCall || pendingUnlikeApiCall;

    return (
        <>
            <div className="card gedf-card mb-3">
                <div className="card-header p-0">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex justify-content-between align-items-center m-2">
                            <div className="mr-2">
                                <Link to={`/user/${username}`}>
                                    <ProfileImageWithDefault profileimage={profileImage} width="64" height="64" className="img-thumbnail rounded-circle p-1 me-1" />
                                </Link>
                            </div>
                            <div className="ml-2">
                                <div className="h5 m-0">{displayName}</div>
                                <Link className="h7 text-decoration-none text-muted" to={`/user/${username}`}>@{username}</Link>
                            </div>
                        </div>
                        {ownedByLoggedInUser && (
                            <label className="btn btn-default ms-auto" onClick={() => setModalVisible(true)}>
                                <img src="https://img.icons8.com/external-anggara-flat-anggara-putra/22/000000/external-delete-interface-anggara-flat-anggara-putra-3.png" alt="delete" />
                            </label>
                        )}
                    </div>
                </div>
                <div className="card-body p-2">
                    <div className="text-end text-muted h7 mb-1">
                        <img src="https://img.icons8.com/external-those-icons-lineal-color-those-icons/17/000000/external-clock-time-calendar-those-icons-lineal-color-those-icons-2.png" alt="clock" />
                        <i> {formatted}</i>
                    </div>
                    <div className="container p-1">
                        <p className="card-text text-start mb-1">
                            {content}
                            {fileAttachment && (
                                <div className="pl-5">
                                    {fileAttachment.fileType.startsWith('image') && (
                                        <img className="img-fluid rounded mx-auto d-block mt-2" src={'images/attachments/' + fileAttachment.name} alt={content} />
                                    )}
                                </div>
                            )}
                        </p>
                    </div>
                </div>
                <div className="card-footer lh-1">
                    <div className="d-flex flex-wrap gap-3 mb-2">
                        {likeCount > 0 && (
                            <div className="text-muted small">
                                <i className="bi bi-hand-thumbs-up-fill me-1"></i>
                                {likeCount} {likeCount === 1 ? t('like') : t('likes')}
                            </div>
                        )}
                        {comments.length > 0 && (
                            <div className="text-muted small">
                                <i className="bi bi-chat-fill me-1"></i>
                                {comments.length} {comments.length === 1 ? t('comment') : t('comments')}
                            </div>
                        )}
                        {shareCount > 0 && (
                            <div className="text-muted small">
                                <i className="bi bi-share-fill me-1"></i>
                                {shareCount} {shareCount === 1 ? t('share') : t('shares')}
                            </div>
                        )}
                    </div>

                    <div className="d-flex justify-content-between border-top pt-2">
                        <div>
                            {/* Like button */}
                            <button
                                className={`card-link text-decoration-none btn btn-link p-0 ${userLiked ? 'text-primary' : ''}`}
                                onClick={handleLikeClick}
                                disabled={pendingLikeAction || !isLoggedIn}
                            >
                                <img
                                    src={userLiked
                                        ? "https://img.icons8.com/external-anggara-blue-anggara-putra/16/000000/external-favorite-interface-anggara-blue-anggara-putra.png"
                                        : "https://img.icons8.com/external-anggara-flat-anggara-putra/16/000000/external-favorite-interface-anggara-flat-anggara-putra.png"
                                    }
                                    alt="like"
                                />
                                {t('Like')}
                            </button>

                            {/* Emoji reaction button */}
                            <button
                                className="card-link text-decoration-none btn btn-link p-0 ms-2"
                                onClick={() => isLoggedIn ? setShowEmojis(!showEmojis) : null}
                                disabled={!isLoggedIn}
                            >
                                <img
                                    src="https://img.icons8.com/external-anggara-flat-anggara-putra/16/000000/external-emoji-interface-anggara-flat-anggara-putra.png"
                                    alt="emoji"
                                />
                                {t('React')}
                            </button>

                            {/* Emoji reaction popup */}
                            {showEmojis && (
                                <div className="position-absolute bg-white shadow-sm rounded p-1 mt-1 d-flex z-index-1">
                                    {emojis.map(emoji => (
                                        <button
                                            key={emoji}
                                            className="btn btn-sm"
                                            onClick={() => handleEmojiReact(emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Comment button */}
                            <button
                                className="card-link text-decoration-none btn btn-link p-0 ms-3"
                                onClick={handleCommentClick}
                            >
                                <img src="https://img.icons8.com/external-anggara-flat-anggara-putra/16/000000/external-report-interface-anggara-flat-anggara-putra-2.png" alt="comment" />
                                {t('Comment')}
                            </button>
                        </div>

                        {/* Share button */}
                        <button
                            className="card-link text-decoration-none btn btn-link p-0"
                            onClick={() => setShareModalVisible(true)}
                        >
                            <img src="https://img.icons8.com/external-anggara-flat-anggara-putra/16/000000/external-share-interface-anggara-flat-anggara-putra-2.png" alt="share" />
                            {t('Share')}
                        </button>
                    </div>

                    {/* Comments section */}
                    {showComments && (
                        <div className="mt-3 border-top pt-2">
                            {/* Comment list */}
                            {comments.length > 0 ? (
                                <div className="comments-list">
                                    {comments.map(comment => (
                                        <div key={comment.id} className={`comment mb-2 ${comment.replyToId ? 'ms-4' : ''}`}>
                                            <div className="d-flex">
                                                <Link to={`/user/${comment.user.username}`} className="me-2">
                                                    <ProfileImageWithDefault
                                                        profileimage={comment.user.profileImage}
                                                        width="32"
                                                        height="32"
                                                        className="img-thumbnail rounded-circle p-1"
                                                    />
                                                </Link>
                                                <div className="bg-light rounded p-2 flex-grow-1">
                                                    <div className="d-flex justify-content-between">
                                                        <Link to={`/user/${comment.user.username}`} className="fw-bold text-decoration-none">
                                                            {comment.user.displayName}
                                                        </Link>
                                                        <small className="text-muted">{format(comment.timestamp, i18n.language)}</small>
                                                    </div>
                                                    <p className="mb-1">{comment.content}</p>
                                                    {isLoggedIn && (
                                                        <button
                                                            className="btn btn-sm text-primary p-0"
                                                            onClick={() => handleReplyClick(comment)}
                                                        >
                                                            {t('Reply')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted">{t('No comments yet.')}</p>
                            )}

                            {/* Comment form */}
                            {isLoggedIn && (
                                <form onSubmit={handleSubmitComment} className="mt-3">
                                    {replyTo && (
                                        <div className="alert alert-info py-1 px-2 d-flex justify-content-between align-items-center">
                                            <small>
                                                {t('Replying to')} <b>{replyTo.user.displayName}</b>
                                            </small>
                                            <button
                                                type="button"
                                                className="btn-close btn-sm"
                                                onClick={handleCancelReply}
                                                aria-label="Close"
                                            ></button>
                                        </div>
                                    )}
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            id="commentInput"
                                            className="form-control"
                                            placeholder={t('Write a comment...')}
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                            disabled={pendingCommentApiCall}
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={!newComment.trim() || pendingCommentApiCall}
                                        >
                                            {t('Post')}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete confirmation modal */}
            <Modal
                visible={modalVisible}
                onClickCancel={onClickCancel}
                okButton={t('Delete post')}
                message={
                    <>
                        <div className="text-center">
                            {t('This post will be permanently deleted.')}<br />
                            {t('Are you sure?')}
                        </div>
                        <div className="card mt-2 p-3 shadow">
                            {content}
                            {fileAttachment && (
                                <div className="pl-5">
                                    {fileAttachment.fileType.startsWith('image') && (
                                        <img className="img-fluid rounded mx-auto d-block mt-2" src={'images/attachments/' + fileAttachment.name} alt={content} />
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                }
                onClickOk={onClickDelete}
                pendingApiCall={pendingApiCall}
            />

            {/* Improved Share modal */}
            <Modal
                visible={shareModalVisible}
                onClickCancel={() => setShareModalVisible(false)}
                title={t('Share this post')}
                message={
                    <div className="d-flex flex-column">
                        <div className="mb-3">
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={shareUrl}
                                    readOnly
                                />
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => handleSharePost('copy')}
                                    disabled={pendingShareApiCall}
                                >
                                    {shareSuccess ? t('Copied!') : t('Copy')}
                                </button>
                            </div>
                        </div>

                        <p className="text-center mb-2">{t('Share via')}</p>

                        <div className="d-flex flex-wrap gap-2 justify-content-center">
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSharePost('facebook')}
                                disabled={pendingShareApiCall}
                            >
                                <i className="bi bi-facebook me-1"></i> Facebook
                            </button>
                            <button
                                className="btn btn-info text-white"
                                onClick={() => handleSharePost('twitter')}
                                disabled={pendingShareApiCall}
                            >
                                <i className="bi bi-twitter me-1"></i> Twitter
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => handleSharePost('linkedin')}
                                disabled={pendingShareApiCall}
                            >
                                <i className="bi bi-linkedin me-1"></i> LinkedIn
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={() => handleSharePost('whatsapp')}
                                disabled={pendingShareApiCall}
                            >
                                <i className="bi bi-whatsapp me-1"></i> WhatsApp
                            </button>
                            <button
                                className="btn btn-info"
                                onClick={() => handleSharePost('telegram')}
                                disabled={pendingShareApiCall}
                            >
                                <i className="bi bi-telegram me-1"></i> Telegram
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => handleSharePost('email')}
                                disabled={pendingShareApiCall}
                            >
                                <i className="bi bi-envelope me-1"></i> Email
                            </button>
                        </div>
                    </div>
                }
            />
        </>
    );
};

export default PostView;