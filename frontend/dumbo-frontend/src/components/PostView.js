import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'timeago.js';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { deletePost } from '../api/apiCalls';
import Modal from './Modal';
import { useApiProgress } from '../shared/ApiProgress';
import ProfileImageWithDefault from './ProfileImageWithDefault';

const PostView = props => {
    const { t, i18n } = useTranslation();
    const { post, onDeletePost } = props;
    const loggedInUser = useSelector(store => store.username);
    const { isLoggedIn } = useSelector(store => ({ isLoggedIn: store.isLoggedIn }));
    const { user, content, timestamp, id, fileAttachment } = post;
    const { username, displayName, profileImage } = user;
    const [modalVisible, setModalVisible] = useState(false);

    const pendingApiCall = useApiProgress('delete', `/api/1.0/posts/${id}`, true);

    const handleDeleteClick = async () => {
        await deletePost(id);
        onDeletePost(id);
        setModalVisible(false);
    };

    const toggleModal = () => {
        setModalVisible(!modalVisible);
    };

    const formatted = format(timestamp, i18n.language);
    const ownedByLoggedInUser = loggedInUser === username;

    return (
        <>
            <div className="card gedf-card mb-3">
                <div className="card-header p-0">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex justify-content-between align-items-center m-2">
                            <div className="mr-2">
                                <Link to={`/user/${username}`}>
                                    <ProfileImageWithDefault 
                                        profileimage={profileImage} 
                                        width="64" 
                                        height="64" 
                                        className="img-thumbnail rounded-circle p-1 me-1" 
                                    />
                                </Link>
                            </div>
                            <div className="ml-2">
                                <div className="h5 m-0">{displayName}</div>
                                <Link className="h7 text-decoration-none text-muted" to={`/user/${username}`}>
                                    @{username}
                                </Link>
                            </div>
                        </div>
                        {ownedByLoggedInUser && (
                            <button 
                                className="btn btn-default ms-auto" 
                                onClick={toggleModal}
                                aria-label="Delete post"
                            >
                                <img 
                                    src="https://img.icons8.com/external-anggara-flat-anggara-putra/22/000000/external-delete-interface-anggara-flat-anggara-putra-3.png" 
                                    alt="Delete" 
                                />
                            </button>
                        )}
                    </div>
                </div>
                <div className="card-body p-2">
                    <div className="text-end text-muted h7 mb-1">
                        <img 
                            src="https://img.icons8.com/external-those-icons-lineal-color-those-icons/17/000000/external-clock-time-calendar-those-icons-lineal-color-those-icons-2.png" 
                            alt="Time" 
                        />
                        <i> {formatted}</i>
                    </div>
                    <div className="container p-1">
                        <p className="card-text text-start mb-1">
                            {content}
                            {fileAttachment && fileAttachment.fileType.startsWith('image') && (
                                <div className="pl-5">
                                    <img 
                                        className="img-fluid rounded mx-auto d-block mt-2" 
                                        src={`images/attachments/${fileAttachment.name}`} 
                                        alt={content} 
                                    />
                                </div>
                            )}
                        </p>
                    </div>
                </div>
                <div className="card-footer lh-1">
                    {isLoggedIn && (
                        <>
                            <Link className="card-link text-decoration-none">
                                <img 
                                    src="https://img.icons8.com/external-anggara-flat-anggara-putra/16/000000/external-favorite-interface-anggara-flat-anggara-putra.png" 
                                    alt="Like" 
                                /> {t('Like')}
                            </Link>
                            <Link className="card-link text-decoration-none">
                                <img 
                                    src="https://img.icons8.com/external-anggara-flat-anggara-putra/16/000000/external-report-interface-anggara-flat-anggara-putra-2.png" 
                                    alt="Comment" 
                                /> {t('Comment')}
                            </Link>
                        </>
                    )}
                    <Link className="card-link text-decoration-none float-end d-inline">
                        <img 
                            src="https://img.icons8.com/external-anggara-flat-anggara-putra/16/000000/external-share-interface-anggara-flat-anggara-putra-2.png" 
                            alt="Share" 
                        /> {t('Share')}
                    </Link>
                </div>
            </div>
            <Modal 
                visible={modalVisible} 
                onClickCancel={toggleModal}
                okButton={t('Delete post')}
                message={
                    <>
                        <div className="text-center">
                            {t('This post will be permanently deleted.')}<br />
                            {t('Are you sure?')}
                        </div>
                        <div className="card mt-2 p-3 shadow">
                            {content}
                            {fileAttachment && fileAttachment.fileType.startsWith('image') && (
                                <div className="pl-5">
                                    <img 
                                        className="img-fluid rounded mx-auto d-block mt-2" 
                                        src={`images/attachments/${fileAttachment.name}`} 
                                        alt={content} 
                                    />
                                </div>
                            )}
                        </div>
                    </>
                } 
                onClickOk={handleDeleteClick}
                pendingApiCall={pendingApiCall}
            />
        </>
    );
};

export default PostView;
