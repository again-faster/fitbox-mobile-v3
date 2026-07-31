import {
	resultDetailCapabilities,
	runResultDetailAction,
} from './resultDetailCapabilities';

describe('resultDetailCapabilities', () => {
	it('hides and blocks result mutations when results are disabled', () => {
		const action = jest.fn();

		expect(resultDetailCapabilities(false)).toEqual({
			canEdit: false,
			canSave: false,
			canDelete: false,
		});
		runResultDetailAction(() => false, action);

		expect(action).not.toHaveBeenCalled();
	});

	it('enables result mutations while results are enabled', () => {
		const action = jest.fn();

		expect(resultDetailCapabilities(true)).toEqual({
			canEdit: true,
			canSave: true,
			canDelete: true,
		});
		runResultDetailAction(() => true, action);

		expect(action).toHaveBeenCalledTimes(1);
	});
});
