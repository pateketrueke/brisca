// eslint-disable-next-line import/no-named-default
import { default as Dialog } from '../components/Dialog.svelte';

export function setDialog(props, callback, component) {
  if (typeof callback === 'object') {
    component = callback;
    callback = null;
  }

  const dialog = new Dialog({
    target: document.body,
    props: {
      component,
      attributes: props,
    },
  });

  setTimeout(() => {
    dialog.$$set({ hidden: false });
  }, 60);

  const deferred = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;

    if (props && props.action) {
      dialog.$on('action', resolve);
    } else if (props && props.confirm) {
      dialog.$on('cancel', reject);
      dialog.$on('confirm', resolve);
    } else {
      setTimeout(resolve, (props && props.timeout) || 0);
    }
  }).then(() => {
    deferred.resolved = true;
  }).catch(() => {
    deferred.rejected = true;
  }).finally(() => {
    dialog.$$set({ hidden: true });
    setTimeout(() => {
      dialog.$destroy();
    }, 60);

    if (typeof callback === 'function') {
      return callback();
    }
  });
  return deferred;
}
