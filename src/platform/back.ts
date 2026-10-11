export function handleBack(
  state: { modalOpen: boolean; canGoBack: boolean },
  actions: {
    closeModal: () => void;
    goBack: () => void;
    confirmExit: () => void;
  },
) {
  if (state.modalOpen) actions.closeModal();
  else if (state.canGoBack) actions.goBack();
  else actions.confirmExit();
}
