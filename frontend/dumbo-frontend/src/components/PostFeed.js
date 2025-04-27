import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ProfileImageWithDefault from './ProfileImageWithDefault';
import Input from './Input';
import Modal from './Modal';
import { updateUser, deleteUser } from '../api/apiCalls';
import { useApiProgress } from '../shared/ApiProgress';
import { updateSuccess, logoutSuccess } from '../redux/authActions';

const ProfileCard = (props) => {
  const { t } = useTranslation();
  const [inEditMode, setInEditMode] = useState(false);
  const [updatedDisplayName, setUpdatedDisplayName] = useState();
  const [editable, setEditable] = useState(false);
  const [user, setUser] = useState({});
  const [newProfileImage, setNewProfileImage] = useState();
  const [validationErrors, setValidationErrors] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { username: loggedInUsername } = useSelector((store) => ({
    username: store.username,
  }));
  const routeParams = useParams();
  const pathUsername = routeParams.username;
  const dispatch = useDispatch();
  const history = useHistory();

  const { username, displayName, profileImage } = user;

  const pendingApiCall = useApiProgress('put', `/api/1.0/users/${username}`);
  const pendingApiCallDeleteUser = useApiProgress('delete', `/api/1.0/users/${username}`, true);

  const { displayName: displayNameError, profileImage: profileImageError } = validationErrors;

  useEffect(() => {
    setUser(props.user);
  }, [props.user]);

  useEffect(() => {
    setEditable(pathUsername === loggedInUsername);
  }, [pathUsername, loggedInUsername]);

  useEffect(() => {
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      displayName: undefined,
    }));
  }, [updatedDisplayName]);

  useEffect(() => {
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      profileImage: undefined,
    }));
  }, [newProfileImage]);

  useEffect(() => {
    if (!inEditMode) {
      setUpdatedDisplayName(undefined);
      setNewProfileImage(undefined);
    } else {
      setUpdatedDisplayName(displayName);
    }
  }, [inEditMode, displayName]);

  const onClickSave = async () => {
    let profileImageBase64;
    if (newProfileImage) {
      profileImageBase64 = newProfileImage.split(',')[1];
    }

    const body = {
      displayName: updatedDisplayName,
      profileImage: profileImageBase64,
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

  const onChangeFile = (event) => {
    const file = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      setNewProfileImage(fileReader.result);
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

  return (
    <div className="container mt-3">
      <div className="row d-flex justify-content-center">
        <div className="col-md-10">
          <div className="card profileCard p-3 py-4">
            <div className="text-center">
              <ProfileImageWithDefault
                width="150"
                height="150"
                className="img-thumbnail rounded-circle"
                alt={`${username} profile`}
                profileimage={profileImage}
                temp={newProfileImage}
              />
            </div>

            {!inEditMode && (
              <div className="text-center mt-3">
                <span className="bg-primary p-1 px-4 rounded text-white">@{username}</span>
                <h3 className="mt-2 mb-0">{displayName}</h3>
                <span>Lorem Ipsum Dolor</span>
                <div className="px-5 mt-1">
                  <p className="fonts">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                    tempor incididunt ut labore et dolore magna aliqua.
                  </p>
                </div>

                {editable && (
                  <div className="buttons">
                    <button
                      className="btn btn-primary px-4"
                      onClick={() => setInEditMode(true)}
                      disabled={pendingApiCall}
                    >
                      {pendingApiCall && <span className="spinner-border spinner-border-sm"></span>}
                      {t('Edit')}
                      <img src="https://img.icons8.com/stickers/30/000000/sign-up.png" alt="Edit" />
                    </button>

                    <button
                      className="btn btn-outline-danger px-4 ms-3"
                      onClick={() => setModalVisible(true)}
                    >
                      {t('Delete')}
                      <img
                        src="https://img.icons8.com/stickers/30/000000/delete-forever.png"
                        alt="Delete"
                      />
                    </button>
                  </div>
                )}
              </div>
            )}

            {inEditMode && (
              <div className="text-center mt-3">
                <div className="mb-3">
                  <input
                    type="file"
                    onChange={onChangeFile}
                    className={profileImageError ? 'form-control is-invalid' : 'form-control mb-2'}
                  />
                  {profileImageError && (
                    <div className="invalid-feedback">{profileImageError}</div>
                  )}
                </div>

                <Input
                  name="displayName"
                  defaultValue={displayName}
                  onChange={(e) => setUpdatedDisplayName(e.target.value)}
                  label={t('Change Display Name')}
                  placeholder="Display Name"
                  error={displayNameError}
                />

                <div className="buttons">
                  <button
                    className="btn btn-primary px-4"
                    onClick={onClickSave}
                    disabled={pendingApiCall}
                  >
                    {pendingApiCall && <span className="spinner-border spinner-border-sm"></span>}
                    {t('Save')}
                    <img src="https://img.icons8.com/stickers/30/000000/inbox.png" alt="Save" />
                  </button>

                  <button
                    className="btn btn-outline-danger px-4 ms-3"
                    onClick={() => setInEditMode(false)}
                    disabled={pendingApiCall}
                  >
                    {t('Cancel')}
                    <img
                      src="https://img.icons8.com/stickers/30/000000/delete-sign.png"
                      alt="Cancel"
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        visible={modalVisible}
        okButton={t('Delete My Account')}
        onClickCancel={onClickCancel}
        onClickOk={onClickDeleteUser}
        message={
          <div className="text-center">
            {t('Your account will be permanently deleted.')}
            <br />
            {t('Are you sure?')}
          </div>
        }
        pendingApiCall={pendingApiCallDeleteUser}
      />
    </div>
  );
};

export default ProfileCard;
