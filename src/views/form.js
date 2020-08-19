/* eslint-disable no-param-reassign, no-console  */
import onChange from 'on-change';

import {
  systemStatuses,
  processStatuses,
  successMessages,
} from '../constants';

const form = document.querySelector('[data-form="rss-form"]');
const urlField = form.elements.url;
const submitButton = document.getElementById('submit-rss-form');
const feedbackElement = document.querySelector('.feedback');

const renderFeedbackMessage = ({ type, message }) => {
  urlField.classList.remove('is-invalid');
  feedbackElement.classList.remove('text-danger');
  feedbackElement.classList.remove('text-success');
  feedbackElement.textContent = '';

  if (type === systemStatuses.SUCCESS) {
    feedbackElement.classList.add('text-success');
  }

  if (type === systemStatuses.ERROR) {
    feedbackElement.classList.add('text-danger');
    urlField.classList.add('is-invalid');
  }

  feedbackElement.textContent = message;
};

const processStateHandler = (processState) => {
  switch (processState) {
    case processStatuses.FAILED:
      submitButton.disabled = false;
      break;
    case processStatuses.FILLING:
      submitButton.disabled = false;
      break;
    case processStatuses.SENDING:
      submitButton.disabled = true;
      break;
    case processStatuses.FINISHED:
      submitButton.disabled = false;
      urlField.value = '';
      renderFeedbackMessage({ type: systemStatuses.SUCCESS, message: successMessages.RSS_LOADED });
      break;
    default:
      throw new Error(`Unknown state: ${processState}`);
  }
};

export default (state) => onChange(state, (path, value) => {
  switch (path) {
    case 'processState':
      processStateHandler(value);
      break;
    case 'valid':
      submitButton.disabled = !value;
      break;
    case 'error':
      submitButton.disabled = false;
      renderFeedbackMessage({ type: systemStatuses.ERROR, message: value });
      break;
    default:
      break;
  }
});
