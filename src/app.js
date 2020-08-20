/* eslint-disable no-param-reassign, no-console  */
import * as _ from 'lodash';
import axios from 'axios';
import i18n from 'i18next';

import resources from './locales';
import { processStatuses } from './constants';
import validate from './helpers/validate';
import parseFeed from './helpers/parseFeed';
import composeWatchedFormState from './views/form';
import composeWatchedContentState from './views/content';

const FEEDS_UPDATE_DELAY = 5000;

const CORS_API_URL = 'https://cors-anywhere.herokuapp.com/';
const buildUrlWithCorsApi = (url) => `${CORS_API_URL}${url}`;

const assignIdsToData = (feedId) => ({ items: posts, ...feed }) => {
  const id = feedId || _.uniqueId();
  const feedWithId = { ...feed, id };
  const postsWithFeedId = posts.map((post) => ({ ...post, feedId: id }));

  return { id, feed: feedWithId, posts: postsWithFeedId };
};

const startFeedsUpdateTimer = (previousPosts, watchedContentState) => {
  let nextPosts = previousPosts;

  setTimeout(() => {
    const promises = watchedContentState.feeds.map(({ id, link }) => {
      const urlWithCorsApi = buildUrlWithCorsApi(link);

      return axios.get(urlWithCorsApi)
        .then(({ data }) => parseFeed(data))
        .then(assignIdsToData(id))
        .then(({ posts }) => {
          const difference = _.differenceWith(posts, previousPosts, _.isEqual);

          if (!_.isEmpty(difference)) {
            nextPosts = [...difference, ...previousPosts];
            watchedContentState.posts = nextPosts;
          }
        });
    });

    Promise
      .all(promises)
      .finally(() => startFeedsUpdateTimer(nextPosts, watchedContentState));
  }, FEEDS_UPDATE_DELAY);
};

const updateValidationState = (error, watchedState) => {
  watchedState.valid = !error;
  watchedState.error = error;
};

export default async () => {
  const state = {
    form: {
      processState: processStatuses.FILLING,
      valid: true,
      error: null,
    },
    feeds: [],
    posts: [],
  };

  await i18n.init({
    lng: 'en',
    debug: true,
    resources,
  });

  const form = document.querySelector('[data-form="rss-form"]');
  const urlField = form.elements.url;
  const submitButton = document.getElementById('submit-rss-form');
  const feedbackElement = document.querySelector('.feedback');
  const feedsContainer = document.getElementById('feeds');

  const watchedFormState = composeWatchedFormState(state.form, {
    urlField,
    submitButton,
    feedbackElement,
  });
  const watchedContentState = composeWatchedContentState(
    _.omit(state, ['form']),
    { feedsContainer },
  );

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const urlFieldValue = urlField.value.trim();
    const alreadyUsedRssLinks = watchedContentState.feeds.map(({ link }) => link);

    const error = validate(urlFieldValue, alreadyUsedRssLinks);
    const isValidForm = !error;

    updateValidationState(error, watchedFormState);

    if (!isValidForm) return;

    watchedFormState.processState = processStatuses.SENDING;

    const urlWithCorsApi = buildUrlWithCorsApi(urlFieldValue);

    axios.get(urlWithCorsApi)
      .then(({ data }) => parseFeed(data))
      .then(assignIdsToData())
      .then(({ posts, feed }) => {
        const feedWithLink = { link: urlFieldValue, ...feed };
        watchedContentState.feeds = [feedWithLink, ...watchedContentState.feeds];
        watchedContentState.posts.push(...posts);
        watchedFormState.processState = processStatuses.FINISHED;

        if (watchedContentState.feeds.length === 1) {
          startFeedsUpdateTimer(state.posts, watchedContentState);
        }
      })
      .catch((err) => {
        watchedFormState.error = i18n.t('errors.network');
        watchedFormState.processState = processStatuses.FAILED;
        throw err;
      });
  });
};
