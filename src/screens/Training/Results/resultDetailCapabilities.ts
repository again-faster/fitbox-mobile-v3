export const resultDetailCapabilities = (resultsEnabled: boolean) => ({
	canEdit: resultsEnabled,
	canSave: resultsEnabled,
	canDelete: resultsEnabled,
});

export const runResultDetailAction = (
	isCurrentlyEnabled: () => boolean,
	action: () => void,
) => {
	if (isCurrentlyEnabled()) action();
};
