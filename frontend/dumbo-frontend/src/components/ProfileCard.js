import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ProfileImageWithDefault from './ProfileImageWithDefault';
import { useTranslation } from 'react-i18next';
import Input from './Input';
import { updateUser, deleteUser, sendPost } from '../api/apiCalls';
import { useApiProgress } from '../shared/ApiProgress';
import { updateSuccess, logoutSuccess } from '../redux/authActions';
import Modal from './Modal';

const ProfileCard = props => {
    const { t } = useTranslation();
    const [inEditMode, setInEditMode] = useState(false);
    const [updatedDisplayName, setUpdatedDisplayName] = useState();
    const { username: loggedInUsername } = useSelector(store => ({ username: store.username }));
    const [editable, setEditable] = useState(false);
    const routeParams = useParams();
    const pathUsername = routeParams.username;
    const [user, setUser] = useState({});
    const [newProfileImage, setNewProfileImage] = useState();
    const [validationErrors, setValidationErrors] = useState({});
    const dispatch = useDispatch();
    const history = useHistory();
    const [modalVisible, setModalVisible] = useState(false);
    const [learningPlanModalVisible, setLearningPlanModalVisible] = useState(false);
    const [liveSessionModalVisible, setLiveSessionModalVisible] = useState(false);
    const [skillShareModalVisible, setSkillShareModalVisible] = useState(false);
    const [learningPlan, setLearningPlan] = useState('');
    const [learningCategory, setLearningCategory] = useState('technology');
    const [learningPlanMedia, setLearningPlanMedia] = useState(null);
    const [learningPlanMediaType, setLearningPlanMediaType] = useState('');
    const [liveSessionTitle, setLiveSessionTitle] = useState('');
    const [liveSessionDescription, setLiveSessionDescription] = useState('');
    const [skillTitle, setSkillTitle] = useState('');
    const [skillCategory, setSkillCategory] = useState('programming');
    const [skillDetails, setSkillDetails] = useState('');
    const [skillLevel, setSkillLevel] = useState('intermediate');

    useEffect(() => {
        setUser(props.user);
    }, [props.user]);

    useEffect(() => {
        setEditable(pathUsername === loggedInUsername);
    }, [pathUsername, loggedInUsername])

    useEffect(() => {
        setValidationErrors(previousValidationErrors => ({
            ...previousValidationErrors,
            displayName: undefined
        }));
    }, [updatedDisplayName]);

    useEffect(() => {
        setValidationErrors(previousValidationErrors => ({
            ...previousValidationErrors,
            profileImage: undefined
        }));
    }, [newProfileImage]);

    useEffect(() => {
        setValidationErrors(previousValidationErrors => ({
            ...previousValidationErrors,
            content: undefined,
            media: undefined
        }));
    }, [learningPlan, learningPlanMedia]);

    useEffect(() => {
        setValidationErrors(previousValidationErrors => ({
            ...previousValidationErrors,
            skillTitle: undefined,
            skillDetails: undefined
        }));
    }, [skillTitle, skillDetails]);

    const { username, displayName, profileImage } = user;

    useEffect(() => {
        if (!inEditMode) {
            setUpdatedDisplayName(undefined);
            setNewProfileImage(undefined);
        } else {
            setUpdatedDisplayName(displayName);
        }
    }, [inEditMode, displayName]);

    const onClickSave = async () => {
        let profileImage;
        if (newProfileImage) {
            profileImage = newProfileImage.split(',')[1]
        }

        const body = {
            displayName: updatedDisplayName,
            profileImage: profileImage
        };
        try {
            const response = await updateUser(username, body);
            setInEditMode(false);
            setUser(response.data);
            dispatch(updateSuccess(response.data));
        } catch (error) {
            setValidationErrors(error.response.data.validationErrors);
        }
    };

    const onChangeFile = event => {
        const file = event.target.files[0];
        const fileReader = new FileReader();
        fileReader.onloadend = () => {
            setNewProfileImage(fileReader.result);
        };
        fileReader.readAsDataURL(file);
    };

    const onChangeLearningPlanMedia = event => {
        const file = event.target.files[0];
        if (!file) {
            setLearningPlanMedia(null);
            setLearningPlanMediaType('');
            return;
        }

        const fileType = file.type.split('/')[0]; // 'image' or 'video'

        if (fileType !== 'image' && fileType !== 'video') {
            setValidationErrors(prev => ({
                ...prev,
                media: 'Only image or video files are allowed'
            }));
            return;
        }

        setLearningPlanMediaType(fileType);
        const fileReader = new FileReader();
        fileReader.onloadend = () => {
            setLearningPlanMedia(fileReader.result);
        };
        fileReader.readAsDataURL(file);
    };

    const onClickCancel = () => {
        setModalVisible(false);
    };

    const onClickDeleteUser = async () => {
        await deleteUser(username);
        setModalVisible(false);
        dispatch(logoutSuccess());
        history.push('/');
    };

    const onClickShareLearningPlan = async () => {
        try {
            let media;
            if (learningPlanMedia) {
                media = learningPlanMedia.split(',')[1];
            }

            const body = {
                content: learningPlan,
                type: 'learning-plan',
                category: learningCategory,
                media: media,
                mediaType: learningPlanMediaType
            };
            await sendPost(body);
            setLearningPlanModalVisible(false);
            setLearningPlan('');
            setLearningPlanMedia(null);
            setLearningPlanMediaType('');
            // Optional: Show success message or redirect to wall
        } catch (error) {
            if (error.response?.data?.validationErrors) {
                setValidationErrors(error.response.data.validationErrors);
            }
        }
    };

    const onLearningPlanCancel = () => {
        setLearningPlanModalVisible(false);
        setLearningPlan('');
        setLearningCategory('technology');
        setLearningPlanMedia(null);
        setLearningPlanMediaType('');
    };

    // Function to start live session
    const onClickStartLiveSession = async () => {
        try {
            const body = {
                content: liveSessionTitle,
                type: 'live-session',
                description: liveSessionDescription
            };

            // Use sendPost instead of startLiveSession since it's not available in the API
            const response = await sendPost(body);
            setLiveSessionModalVisible(false);

            // Redirect to the post detail page or another appropriate page
            if (response.data && response.data.id) {
                history.push(`/posts/${response.data.id}`);
            } else {
                // Fallback if no ID is returned
                history.push('/');
            }
        } catch (error) {
            if (error.response?.data?.validationErrors) {
                setValidationErrors(error.response.data.validationErrors);
            }
        }
    };

    const onLiveSessionCancel = () => {
        setLiveSessionModalVisible(false);
        setLiveSessionTitle('');
        setLiveSessionDescription('');
    };

    // Function to share skill
    const onClickShareSkill = async () => {
        try {
            const body = {
                content: skillDetails,
                type: 'skill-share',
                title: skillTitle,
                category: skillCategory,
                level: skillLevel
            };

            const response = await sendPost(body);
            setSkillShareModalVisible(false);
            setSkillTitle('');
            setSkillDetails('');
            setSkillCategory('programming');
            setSkillLevel('intermediate');

            // Optional: Show success message
            if (response.data && response.data.id) {
                history.push(`/posts/${response.data.id}`);
            } else {
                history.push('/');
            }
        } catch (error) {
            if (error.response?.data?.validationErrors) {
                setValidationErrors(error.response.data.validationErrors);
            }
        }
    };

    const onSkillShareCancel = () => {
        setSkillShareModalVisible(false);
        setSkillTitle('');
        setSkillDetails('');
        setSkillCategory('programming');
        setSkillLevel('intermediate');
    };

    const pendingApiCall = useApiProgress('put', '/api/1.0/users/' + username);
    const pendingApiCallDeleteUser = useApiProgress('delete', `/api/1.0/users/${username}`, true);
    const pendingApiCallLearningPlan = useApiProgress('post', '/api/1.0/posts', true);
    const pendingApiCallLiveSession = useApiProgress('post', '/api/1.0/posts', true);
    const pendingApiCallSkillShare = useApiProgress('post', '/api/1.0/posts', true);

    const {
        displayName: displayNameError,
        profileImage: profileImageError,
        content: contentError,
        media: mediaError,
        title: titleError,
        description: descriptionError,
        skillTitle: skillTitleError,
        skillDetails: skillDetailsError
    } = validationErrors;

    const categories = [
        { value: 'technology', label: 'Technology' },
        { value: 'science', label: 'Science' },
        { value: 'arts', label: 'Arts & Humanities' },
        { value: 'business', label: 'Business' },
        { value: 'health', label: 'Health & Fitness' },
        { value: 'languages', label: 'Languages' },
        { value: 'personal', label: 'Personal Development' },
        { value: 'other', label: 'Other' }
    ];

    const skillCategories = [
        { value: 'programming', label: 'Programming' },
        { value: 'design', label: 'Design' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'writing', label: 'Writing' },
        { value: 'music', label: 'Music' },
        { value: 'language', label: 'Language' },
        { value: 'cooking', label: 'Cooking' },
        { value: 'finance', label: 'Finance' },
        { value: 'sports', label: 'Sports & Fitness' },
        { value: 'crafts', label: 'Arts & Crafts' },
        { value: 'other', label: 'Other' }
    ];

    const skillLevels = [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
        { value: 'expert', label: 'Expert' }
    ];

    return (
        <div className="container mt-3">
            <div className="row d-flex justify-content-center">
                <div className="col-md-10">
                    <div className="card profileCard p-3 py-4">
                        <div className="text-center">
                            <ProfileImageWithDefault width="150" height="150" className="img-thumbnail rounded-circle" alt={`${username} profile`} profileimage={profileImage} temp={newProfileImage} />
                        </div>
                        {!inEditMode && (
                            <div className="text-center mt-3">
                                <span className="bg-primary p-1 px-4 rounded text-white">@{username}</span>
                                <h3 className="mt-2 mb-0">{displayName}</h3>
                                <span>Welcome</span>
                                <div className="px-5 mt-1">
                                    <p className="fonts">MindMingle</p>
                                </div>
                                <div className="buttons">
                                    {editable && (
                                        <>
                                            <button className="btn btn-primary px-4" onClick={() => setInEditMode(true)}>
                                                {pendingApiCall && <span className="spinner-border spinner-border-sm"></span>}
                                                {t('Edit')}<img src="https://img.icons8.com/stickers/30/000000/sign-up.png" alt='Edit' />
                                            </button>
                                            <button className="btn btn-outline-danger px-4 ms-3" onClick={() => setModalVisible(true)}>
                                                {t('Delete')}<img src="https://img.icons8.com/stickers/30/000000/delete-forever.png" alt='Delete' />
                                            </button>
                                        </>
                                    )}
                                    <div className="mt-2">
                                        <button
                                            className="btn btn-success px-4"
                                            onClick={() => setLearningPlanModalVisible(true)}
                                        >
                                            {t('Learning Plan')}<img src="https://img.icons8.com/stickers/30/000000/book.png" alt='Learning Plan' />
                                        </button>
                                        <button
                                            className="btn btn-danger px-4 ms-3"
                                            onClick={() => setLiveSessionModalVisible(true)}
                                        >
                                            {t('Go Live')}<img src="https://img.icons8.com/stickers/30/000000/video-call.png" alt='Go Live' />
                                        </button>
                                        <button
                                            className="btn btn-info px-4 ms-3"
                                            onClick={() => setSkillShareModalVisible(true)}
                                        >
                                            {t('Share Skill')}<img src="https://img.icons8.com/stickers/30/000000/graduation-cap.png" alt='Share Skill' />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {inEditMode && (
                            <div className="text-center mt-3">
                                <div className="mb-3">
                                    <input type="file" onChange={onChangeFile} className={profileImageError ? "form-control is-invalid" : "form-control mb-2"} />
                                    <div className="invalid-feedback">{profileImageError}</div>
                                </div>
                                <Input name="displayName" defaultValue={displayName} onChange={(event) => { setUpdatedDisplayName(event.target.value) }} label={t("Change Display Name")} placeholder="Display Name" error={displayNameError}></Input>
                                <div className="buttons">
                                    <button className="btn btn-primary px-4" onClick={onClickSave} disabled={pendingApiCall}>
                                        {pendingApiCall && <span className="spinner-border spinner-border-sm"></span>}
                                        {t('Save')}<img src="https://img.icons8.com/stickers/30/000000/inbox.png" alt='Save' />
                                    </button>
                                    <button className="btn btn-outline-danger px-4 ms-3" onClick={() => setInEditMode(false)} disabled={pendingApiCall}>
                                        {t('Cancel')}<img src="https://img.icons8.com/stickers/30/000000/delete-sign.png" alt='Cancel' />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Account Modal */}
            <Modal
                visible={modalVisible}
                okButton={t('Delete My Account')}
                onClickCancel={onClickCancel}
                onClickOk={onClickDeleteUser}
                message={<div className="text-center">{t('Your account will be permanently deleted.')}<br />{t('Are you sure?')}</div>}
                pendingApiCall={pendingApiCallDeleteUser}
            />

            {/* Learning Plan Modal */}
            <Modal
                visible={learningPlanModalVisible}
                title={t('Create Learning Plan')}
                okButton={t('Share Plan')}
                onClickCancel={onLearningPlanCancel}
                onClickOk={onClickShareLearningPlan}
                pendingApiCall={pendingApiCallLearningPlan}
                message={
                    <div>
                        <div className="form-group mb-3">
                            <label className="form-label">{t('Select Category')}</label>
                            <select
                                className="form-select"
                                value={learningCategory}
                                onChange={(e) => setLearningCategory(e.target.value)}
                            >
                                {categories.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group mb-3">
                            <label className="form-label">{t('Learning Plan Details')}</label>
                            <textarea
                                className={contentError ? "form-control is-invalid" : "form-control"}
                                rows="5"
                                value={learningPlan}
                                onChange={(e) => setLearningPlan(e.target.value)}
                                placeholder={t('Describe your learning goals, timeline, and resources...')}
                            ></textarea>
                            {contentError && <div className="invalid-feedback">{contentError}</div>}
                        </div>
                        <div className="form-group mb-3">
                            <label className="form-label">{t('Add Image or Video (Optional)')}</label>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={onChangeLearningPlanMedia}
                                className={mediaError ? "form-control is-invalid" : "form-control"}
                            />
                            {mediaError && <div className="invalid-feedback">{mediaError}</div>}
                        </div>
                        {learningPlanMedia && (
                            <div className="form-group mb-3">
                                <label className="form-label">{t('Preview')}</label>
                                <div className="text-center border p-2">
                                    {learningPlanMediaType === 'image' && (
                                        <img
                                            src={learningPlanMedia}
                                            alt="Learning plan preview"
                                            className="img-fluid"
                                            style={{ maxHeight: '200px' }}
                                        />
                                    )}
                                    {learningPlanMediaType === 'video' && (
                                        <video
                                            src={learningPlanMedia}
                                            controls
                                            className="img-fluid"
                                            style={{ maxHeight: '200px' }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                }
            />

            {/* Live Session Modal */}
            <Modal
                visible={liveSessionModalVisible}
                title={t('Start Live Session')}
                okButton={t('Go Live')}
                onClickCancel={onLiveSessionCancel}
                onClickOk={onClickStartLiveSession}
                pendingApiCall={pendingApiCallLiveSession}
                message={
                    <div>
                        <div className="form-group mb-3">
                            <label className="form-label">{t('Session Title')}</label>
                            <input
                                type="text"
                                className={titleError ? "form-control is-invalid" : "form-control"}
                                value={liveSessionTitle}
                                onChange={(e) => setLiveSessionTitle(e.target.value)}
                                placeholder={t('Enter a title for your live session')}
                            />
                            {titleError && <div className="invalid-feedback">{titleError}</div>}
                        </div>
                        <div className="form-group mb-3">
                            <label className="form-label">{t('Session Description')}</label>
                            <textarea
                                className={descriptionError ? "form-control is-invalid" : "form-control"}
                                rows="3"
                                value={liveSessionDescription}
                                onChange={(e) => setLiveSessionDescription(e.target.value)}
                                placeholder={t('What will you share in this live session?')}
                            ></textarea>
                            {descriptionError && <div className="invalid-feedback">{descriptionError}</div>}
                        </div>
                        <div className="alert alert-info">
                            <small>
                                {t('By starting a live session, you agree to our community guidelines. Your camera and microphone will be activated once you go live.')}
                            </small>
                        </div>
                    </div>
                }
            />

            {/* Skill Share Modal */}
            <Modal
                visible={skillShareModalVisible}
                title={t('Share Your Skills')}
                okButton={t('Share Skill')}
                onClickCancel={onSkillShareCancel}
                onClickOk={onClickShareSkill}
                pendingApiCall={pendingApiCallSkillShare}
                message={
                    <div>
                        <div className="form-group mb-3">
                            <label className="form-label">{t('Skill Title')}</label>
                            <input
                                type="text"
                                className={skillTitleError ? "form-control is-invalid" : "form-control"}
                                value={skillTitle}
                                onChange={(e) => setSkillTitle(e.target.value)}
                                placeholder={t('Name your skill (e.g. Python Programming, Digital Illustration)')}
                            />
                            {skillTitleError && <div className="invalid-feedback">{skillTitleError}</div>}
                        </div>
                        <div className="form-group mb-3">
                            <label className="form-label">{t('Skill Category')}</label>
                            <select
                                className="form-select"
                                value={skillCategory}
                                onChange={(e) => setSkillCategory(e.target.value)}
                            >
                                {skillCategories.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group mb-3">
                            <label className="form-label">{t('Proficiency Level')}</label>
                            <select
                                className="form-select"
                                value={skillLevel}
                                onChange={(e) => setSkillLevel(e.target.value)}
                            >
                                {skillLevels.map((level) => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group mb-3">
                            <label className="form-label">{t('Skill Details')}</label>
                            <textarea
                                className={skillDetailsError ? "form-control is-invalid" : "form-control"}
                                rows="4"
                                value={skillDetails}
                                onChange={(e) => setSkillDetails(e.target.value)}
                                placeholder={t('Describe your experience, expertise, and what you can teach others...')}
                            ></textarea>
                            {skillDetailsError && <div className="invalid-feedback">{skillDetailsError}</div>}
                        </div>
                        <div className="alert alert-success">
                            <small>
                                {t('Sharing your skills helps others find mentors and collaborators in the community!')}
                            </small>
                        </div>
                    </div>
                }
            />
        </div>
    );
};

export default ProfileCard;