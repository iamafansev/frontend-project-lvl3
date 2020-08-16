/* eslint-disable no-param-reassign, no-console  */
import * as _ from 'lodash';
import axios from 'axios';

import { processStatuses, errorMessages } from './constants';
import validate from './helpers/validate';
import parseFeed from './helpers/parseFeed';
import composeWatchedFormState from './veiws/form';

const updateValidationState = (error, watchedState) => {
  watchedState.valid = !error;
  watchedState.error = error;
};

export default function App() {
  const state = {
    form: {
      processState: processStatuses.FILLING,
      valid: true,
      error: null,
      usedLinks: [],
    },
    feeds: [],
  };

  const form = document.querySelector('[data-form="rss-form"]');
  const urlField = form.elements.url;

  const watchedFormState = composeWatchedFormState(state.form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const urlFieldValue = urlField.value.trim();

    const error = validate(urlFieldValue, watchedFormState.usedLinks);
    const isValidForm = !error;

    updateValidationState(error, watchedFormState);

    if (!isValidForm) return;

    watchedFormState.processState = processStatuses.SENDING;

    axios.get(urlFieldValue)
      .then(({ data }) => {
        const { items, ...meta } = parseFeed(data);
        const id = _.uniqueId();
        const itemsWithId = _.map(items, (item) => ({ ...item, id: _.uniqueId() }));

        return { ...meta, id, items: itemsWithId };
      })
      .then((data) => {
        console.log(data);
        watchedFormState.processState = processStatuses.FINISHED;
        watchedFormState.usedLinks.push(urlFieldValue);
      })
      .catch((err) => {
        watchedFormState.error = errorMessages.NETWORK;
        watchedFormState.processState = processStatuses.FAILED;
        throw err;
      });
  });
}
