import { SkeletonView, Spacer } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const CalendarSkeletonLoader: React.FC = React.memo(() => (
	<View style={styles.container}>
		<SkeletonView width="95%" height={60} />
		<Spacer size={config.metrics.xl} />
		<SkeletonView width="25%" height={18} style={layout.selfStart} />
		<Spacer size={config.metrics.rg} />
		<SkeletonView width="100%" height={60} />
		<Spacer size={config.metrics.rg} />
		<SkeletonView width="100%" height={60} />
		<Spacer size={config.metrics.rg} />
		<SkeletonView width="100%" height={60} />
		<Spacer size={config.metrics.xl} />
		<SkeletonView width="25%" height={18} style={layout.selfStart} />
		<Spacer size={config.metrics.rg} />
		<SkeletonView width="100%" height={60} />
		<Spacer size={config.metrics.rg} />
		<SkeletonView width="100%" height={60} />
		<Spacer size={config.metrics.rg} />
		<SkeletonView width="100%" height={60} />
		<Spacer size={config.metrics.rg} />
		<SkeletonView width="100%" height={60} />
	</View>
));

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		backgroundColor: 'white',
		width: '100%',
		height: '100%',
		zIndex: 1000,
		alignItems: 'center',
		padding: config.metrics.rg,
	},
});

export default CalendarSkeletonLoader;
