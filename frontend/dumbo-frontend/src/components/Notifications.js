import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getNotifications, markNotificationAsRead } from '../api/apiCalls';
import { useApiProgress } from '../shared/ApiProgress';
import ProfileImageWithDefault from '../components/ProfileImageWithDefault';
import { format } from 'timeago.js';

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const { isLoggedIn } = useSelector(store => ({ isLoggedIn: store.isLoggedIn }));
  
  const pendingApiCall = useApiProgress('get', '/api/1.0/notifications', true);
  const pendingReadApiCall = useApiProgress('post', '/api/1.0/notifications/read', true);

  useEffect(() => {
    if (isLoggedIn) {
      loadNotifications();
    }
  }, [isLoggedIn, page]);

  const loadNotifications = async () => {
    try {
      const response = await getNotifications(page, 20);
      setNotifications(prevNotifications => {
        if (page === 0) {
          return response.data.content;
