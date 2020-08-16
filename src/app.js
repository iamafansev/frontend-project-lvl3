/* eslint-disable no-param-reassign, no-console  */
import { processStatuses, errorMessages } from './constants';
import validate from './helpers/validate';
import composeWatchedFormState from './veiws/form';

const updateValidationState = (error, watchedState) => {
  watchedState.valid = !error;
  watchedState.error = error;
};

export default function App() {
  const state = {
    form: {
      processState: processStatuses.FILLING,
      processError: null,
      valid: true,
      error: null,
      usedLinks: [],
    },
  };

  const form = document.querySelector('[data-form="rss-form"]');
  const urlField = form.elements.url;

  const watchedFormState = composeWatchedFormState(state.form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { value: urlFieldValue } = urlField;

    const error = validate(urlFieldValue, watchedFormState.usedLinks);
    const isValidForm = !error;

    updateValidationState(error, watchedFormState);

    if (!isValidForm) return;

    watchedFormState.processState = processStatuses.SENDING;

    try {
      watchedFormState.processState = processStatuses.FINISHED;
      watchedFormState.usedLinks.push(urlFieldValue);
    } catch (err) {
      watchedFormState.processError = errorMessages.NETWORK;
      watchedFormState.processState = processStatuses.FAILED;
      throw err;
    }
  });
}
