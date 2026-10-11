import { it, expect, vi } from "vitest";
import { handleBack } from "../../src/platform/back";
it("closes the topmost modal before navigating and only exits at root when confirmed", () => {
  const actions = {
    closeModal: vi.fn(),
    goBack: vi.fn(),
    confirmExit: vi.fn(),
  };
  handleBack({ modalOpen: true, canGoBack: true }, actions);
  expect(actions.closeModal).toHaveBeenCalledOnce();
  expect(actions.goBack).not.toHaveBeenCalled();
  handleBack({ modalOpen: false, canGoBack: true }, actions);
  expect(actions.goBack).toHaveBeenCalledOnce();
  handleBack({ modalOpen: false, canGoBack: false }, actions);
  expect(actions.confirmExit).toHaveBeenCalledOnce();
});
