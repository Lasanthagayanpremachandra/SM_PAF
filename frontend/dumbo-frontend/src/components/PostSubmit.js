import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from "react-redux";
import { useApiProgress } from '../shared/ApiProgress';
import { sendPost, postPostAttachment } from "../api/apiCalls";
import ProfileImageWithDefault from '../components/ProfileImageWithDefault'
import AutoUploadImage from './AutoUploadImage.js';

const PostSubmit = () => {
    const { t } = useTranslation();
    const [post, setPost] = useState('');
    const [skill, setSkill] = useState('');
    const [errors, setErrors] = useState({});
    const [focused, setFocused] = useState(false);
    const [newImage, setNewImage] = useState();
    const [attachmentId, setAttachmentId] = useState();
    const [activeTab, setActiveTab] = useState('posts');
    const [fileType, setFileType] = useState('image');
    const [skillCategory, setSkillCategory] = useState('');
    const [educationLevel, setEducationLevel] = useState('');

    const pendingApiCall = useApiProgress('post', '/api/1.0/posts', true);
    const pendingFileUpload = useApiProgress('post', '/api/1.0/post-attachments', true);

    const { username, profileImage } = useSelector(store => ({
        username: store.username,
        profileImage: store.profileImage
    }));

    // Skill categories
    const skillCategories = [
        'Technology', 'Arts', 'Business', 'Education', 'Health',
        'Language', 'Music', 'Sports', 'Cooking', 'Other'
    ];

    // Education levels
    const educationLevels = [
        'Beginner', 'Intermediate', 'Advanced', 'Expert', 'All Levels'
    ];

    useEffect(() => {
        if (!focused) {
            setPost('');
            setSkill('');
            setErrors({});
            setNewImage();
            setAttachmentId();
            setFileType('image');
            setSkillCategory('');
            setEducationLevel('');
        }
    }, [focused]);

    useEffect(() => {
        setErrors({});
    }, [post, skill, skillCategory, educationLevel]);

    const onClickPost = async () => {
        const body = {
            content: activeTab === 'posts' ? post : skill,
            attachmentId: attachmentId,
            // Add a type field to distinguish between regular posts and skill posts
            type: activeTab === 'posts' ? 'post' : 'skill',
            // Include the file type for skill posts
            fileType: activeTab === 'skills' ? fileType : null,
            // Include category and education level for skill posts
            skillCategory: activeTab === 'skills' ? skillCategory : null,
            educationLevel: activeTab === 'skills' ? educationLevel : null
        }

        try {
            // Use the same API endpoint for both posts and skills
            await sendPost(body);
            setFocused(false);
        } catch (error) {
            if (error.response?.data?.validationErrors) {
                setErrors(error.response.data.validationErrors);
            }
        }
    }

    const onChangeFile = event => {
        if (event.target.files.length < 1) {
            return;
        }
        const file = event.target.files[0];
        const fileReader = new FileReader();
        fileReader.onloadend = () => {
            setNewImage(fileReader.result);
            uploadFile(file);
        };
        fileReader.readAsDataURL(file);
    };

    const uploadFile = async file => {
        const attachment = new FormData();
        attachment.append('file', file);
        // For file attachments, use only the existing API endpoint
        const response = await postPostAttachment(attachment);
        setAttachmentId(response.data.id);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setErrors({});
    };

    let textAreaClass = 'form-control';
    if (errors.content) {
        textAreaClass += ' is-invalid';
    }

    let categoryClass = 'form-select';
    if (errors.skillCategory) {
        categoryClass += ' is-invalid';
    }

    let educationClass = 'form-select';
    if (errors.educationLevel) {
        educationClass += ' is-invalid';
    }

    return (
        <div className="card gedf-card mb-2">
            <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs" id="myTab" role="tablist">
                    <li className="nav-item">
                        <a
                            className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`}
                            id="posts-tab"
                            data-toggle="tab"
                            href="#posts"
                            role="tab"
                            aria-controls="posts"
                            aria-selected={activeTab === 'posts'}
                            onClick={() => handleTabChange('posts')}
                        >
                            {t('Make a publication')}
                        </a>
                    </li>
                    <li className="nav-item">
                        <a
                            className={`nav-link ${activeTab === 'skills' ? 'active' : ''}`}
                            id="skills-tab"
                            data-toggle="tab"
                            href="#skills"
                            role="tab"
                            aria-controls="skills"
                            aria-selected={activeTab === 'skills'}
                            onClick={() => handleTabChange('skills')}
                        >
                            {t('Share a skill')}
                        </a>
                    </li>
                    <li className="nav-item ms-auto">
                        <Link className="nav-link" id="profile-tab" data-toggle="tab" role="tab" aria-controls="profile" aria-selected="false" to={`/user/${username}`}>
                            <ProfileImageWithDefault className="rounded-circle" width="26" height="26" profileimage={profileImage} />
                        </Link>
                    </li>
                </ul>
            </div>

            <div className="card-body p-2">
                <div className="tab-content" id="myTabContent">
                    {/* Posts Tab Content */}
                    <div className={`tab-pane fade ${activeTab === 'posts' ? 'show active' : ''}`} id="posts" role="tabpanel" aria-labelledby="posts-tab">
                        <div className="form-group mb-2">
                            <textarea
                                className={textAreaClass}
                                id="post-message"
                                rows={focused && activeTab === 'posts' ? "3" : "1"}
                                onFocus={() => {setFocused(true); setActiveTab('posts');}}
                                onChange={event => setPost(event.target.value)}
                                value={post}
                                placeholder={t('What are you thinking?')}>
                            </textarea>
                            <div className="invalid-feedback">{errors.content}</div>
                        </div>
                    </div>

                    {/* Skills Tab Content */}
                    <div className={`tab-pane fade ${activeTab === 'skills' ? 'show active' : ''}`} id="skills" role="tabpanel" aria-labelledby="skills-tab">
                        <div className="form-group mb-2">
                            <textarea
                                className={textAreaClass}
                                id="skill-message"
                                rows={focused && activeTab === 'skills' ? "3" : "1"}
                                onFocus={() => {setFocused(true); setActiveTab('skills');}}
                                onChange={event => setSkill(event.target.value)}
                                value={skill}
                                placeholder={t('What skill would you like to share?')}>
                            </textarea>
                            <div className="invalid-feedback">{errors.content}</div>
                        </div>

                        {/* Display category and education level when focused and in skills tab */}
                        {focused && activeTab === 'skills' && (
                            <div className="row mt-2">
                                <div className="col-md-6 mb-2">
                                    <select
                                        className={categoryClass}
                                        id="skill-category"
                                        value={skillCategory}
                                        onChange={e => setSkillCategory(e.target.value)}
                                        required
                                    >
                                        <option value="">{t('Select category')}</option>
                                        {skillCategories.map((category, index) => (
                                            <option key={index} value={category}>{t(category)}</option>
                                        ))}
                                    </select>
                                    <div className="invalid-feedback">{errors.skillCategory}</div>
                                </div>
                                <div className="col-md-6 mb-2">
                                    <select
                                        className={educationClass}
                                        id="education-level"
                                        value={educationLevel}
                                        onChange={e => setEducationLevel(e.target.value)}
                                        required
                                    >
                                        <option value="">{t('Select education level')}</option>
                                        {educationLevels.map((level, index) => (
                                            <option key={index} value={level}>{t(level)}</option>
                                        ))}
                                    </select>
                                    <div className="invalid-feedback">{errors.educationLevel}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* File Preview and Buttons - shown when focused */}
                    {focused && <>
                        {newImage && <AutoUploadImage image={newImage} uploading={pendingFileUpload} />}

                        <div className="btn-toolbar justify-content-between mb-2">
                            <div>
                                {activeTab === 'skills' && (
                                    <div className="btn-group me-2">
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${fileType === 'image' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setFileType('image')}
                                        >
                                            {t('Image')}
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${fileType === 'video' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setFileType('video')}
                                        >
                                            {t('Video')}
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${fileType === 'document' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setFileType('document')}
                                        >
                                            {t('Document')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="btn-toolbar justify-content-end">
                            <label className="btn btn-default p-0 ms-1 me-auto">
                                {fileType === 'image' && <img src="https://img.icons8.com/color/32/000000/pictures-folder.png" alt="imagesubmit" />}
                                {fileType === 'video' && <img src="https://img.icons8.com/color/32/000000/video.png" alt="videosubmit" />}
                                {fileType === 'document' && <img src="https://img.icons8.com/color/32/000000/document.png" alt="documentsubmit" />}
                                <input
                                    type="file"
                                    onChange={onChangeFile}
                                    accept={
                                        fileType === 'image' ? 'image/*' :
                                        fileType === 'video' ? 'video/*' :
                                        fileType === 'document' ? '.pdf,.doc,.docx,.txt,.ppt,.pptx' :
                                        undefined
                                    }
                                    hidden
                                />
                            </label>
                            <div className="btn-group">
                                <button
                                    type="submit"
                                    onClick={onClickPost}
                                    className="btn btn-primary text-light"
                                    disabled={
                                        pendingApiCall ||
                                        pendingFileUpload ||
                                        (activeTab === 'skills' && (!skillCategory || !educationLevel))
                                    }
                                >
                                    {pendingApiCall && <span className="spinner-border spinner-border-sm"></span>}
                                    {activeTab === 'posts' ? t('Share') : t('Share Skill')}
                                </button>
                                <button className="btn btn-outline-danger px-1 ms-1" onClick={() => setFocused(false)} disabled={pendingApiCall || pendingFileUpload}>
                                    <img src="https://img.icons8.com/stickers/18/000000/delete-sign.png" alt='Cancel' />
                                </button>
                            </div>
                        </div>
                    </>}
                </div>
            </div>
        </div>
    );
};

export default PostSubmit;