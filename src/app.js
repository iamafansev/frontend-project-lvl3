import _ from 'lodash';
import * as yup from 'yup';
import onChange from 'on-change';

const FILLING_PROCESS_STATUS = 'filling';
const SENDING_PROCESS_STATUS = 'sending';
const FAILED_PROCESS_STATUS = 'failed';
const FINISHED_PROCESS_STATUS = 'finished';

const NETWORK_ERROR_MESSAGE = 'Network Problems. Try again.';
const URL_ERROR_MESSAGE = 'This must be a valid URL'

const schema = yup.string().url(URL_ERROR_MESSAGE);

const validate = (fields) => {
  try {
    schema.validateSync(fields);
    return null;
  } catch (e) {
    return e.message;
  }
};

const updateValidationState = (error, watchedState) => {
  watchedState.form.valid = !error;
  watchedState.form.error = error;
};

const renderErrors = (element, error) => {
  const feedbackElement = document.querySelector('.feedback');

  if (feedbackElement.classList.contains('text-danger')) {
    element.classList.remove('is-invalid');
    feedbackElement.classList.remove('text-danger');
    feedbackElement.textContent = '';
  }

  if (!error) {
    return;
  }

  feedbackElement.classList.add('text-danger');
  feedbackElement.textContent = error;
  element.classList.add('is-invalid');
};

export default function App() {
  const state = {
    form: {
      processState: FILLING_PROCESS_STATUS,
      processError: null,
      valid: true,
      error: null,
    },
  };

  const form = document.querySelector('[data-form="rss-form"]');
  const urlField = form.elements.url;
  const submitButton = form.querySelector('button[type="submit"]');

  const processStateHandler = (processState) => {
    switch (processState) {
      case FAILED_PROCESS_STATUS:
        submitButton.disabled = false;
        break;
      case FILLING_PROCESS_STATUS:
        submitButton.disabled = false;
        break;
      case SENDING_PROCESS_STATUS:
        submitButton.disabled = true;
        break;
      case FINISHED_PROCESS_STATUS:
        submitButton.disabled = false;
        urlField.value = '';
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.processState':
        processStateHandler(value);
        break;
      case 'form.valid':
        submitButton.disabled = !value;
        break;
      case 'form.error':
        submitButton.disabled = false;
        renderErrors(urlField, value);
        break;
      default:
        break;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const error = validate(urlField.value);
    const isValidForm = !error;

    updateValidationState(error, watchedState);

    if (!isValidForm) {
      return;
    }

    watchedState.form.processState = SENDING_PROCESS_STATUS;

    try {
      watchedState.form.processState = FINISHED_PROCESS_STATUS;
    } catch (err) {
      watchedState.form.processError = NETWORK_ERROR_MESSAGE;
      watchedState.form.processState = FAILED_PROCESS_STATUS;
      throw err;
    }
  });
}
