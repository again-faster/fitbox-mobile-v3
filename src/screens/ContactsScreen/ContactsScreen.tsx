import useAuth from '@/auth/hooks/useAuth';
import { Row, Text } from '@/components/atoms';
import HeaderButtonGroup from '@/components/template/Header/HeaderButtonGroup';
import { goBack } from '@/navigators/NavigationRef';
import { getContacts } from '@/services/message';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ComposeScreenProps } from '@/types/navigation';
import {
	ContactGroupMembersType,
	ContactGroupType,
	ContactMembersType,
} from '@/types/schemas/message';
import { Constant, Say } from '@/utils';
import useStore from '@/zustand/Store';
import { sortBy as _sortBy } from 'lodash';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { List, Searchbar } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

type State = {
	list: ContactMembersType[];
	groups: ContactGroupType[];
	loading: boolean;
	refreshing: boolean;
	sortBy: string;
	searchQuery: string;
};
const ContactsScreen = ({ navigation }: ComposeScreenProps) => {
	const { user } = useAuth();
	const { setAppState } = useStore(state => ({
		setAppState: state.setAppState,
	}));
	const [state, setState] = useState<State>({
		list: [],
		groups: [],
		loading: true,
		refreshing: false,
		sortBy: 'player',
		searchQuery: '',
	});
	const stateRef = useRef<State>();
	stateRef.current = state;
	const [selectAll, setSelectAll] = useState<boolean>(false);

	const renderHeaderComposeButton = () => (
		<TouchableOpacity
			style={{ paddingHorizontal: config.metrics.lg }}
			onPress={saveContacts}
		>
			<Text color="info">Next</Text>
		</TouchableOpacity>
	);

	const renderCloseButton = () => {
		return (
			<HeaderButtonGroup>
				<Ionicons name="close" size={24} onPress={handleCloseButton} />
			</HeaderButtonGroup>
		);
	};

	const handleCloseButton = () => {
		setAppState('message', '');
		setAppState('subject', '');
		goBack();
	};

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: renderHeaderComposeButton,
			headerLeft: renderCloseButton,
			title: 'Recipients',
		});
	}, []);

	useEffect(() => {
		void (async () => {
			await getData();
		})();
	}, []);

	const saveContacts = () => {
		const { list, groups } = stateRef.current as State;
		const contacts: ContactMembersType[] = [];

		groups.forEach(group => {
			group.members?.forEach((c: ContactGroupMembersType) => {
				if (c.is_selected) {
					const contact = {
						...c,
						fullname: `${c.first_name} ${c.last_name}`,
					};
					contacts.push(contact);
				}
			});
		});

		list.forEach((c: ContactMembersType) => {
			if (c.is_selected && !contacts.includes(c)) {
				contacts.push(c);
			}
		});

		navigation.navigate('Compose', {
			contacts,
		});
	};

	const getData = async (sortByRefresh?: string) => {
		setState(prevState => ({ ...prevState, refreshing: true }));

		let list: ContactMembersType[] = [];
		let groups: ContactGroupType[] = [];
		let sort = '';
		try {
			const res = await getContacts();
			groups = res.data.groups;
			list = res.data.members;
		} catch (e) {
			Say.err(e as string);
		}

		if (sort === '') {
			sort = user?.user_data.is_staff ? 'player' : 'staff';
		}

		setState(prevState => ({
			...prevState,
			list: _sortBy(list, 'fullname'),
			groups,
			loading: false,
			refreshing: false,
			sortBy: sortByRefresh || sort,
		}));
	};

	const handleTabPress = (sort: string) => {
		setState(prevState => ({ ...prevState, sortBy: sort }));
	};

	const handleToggleContact = (index: number) => {
		const { list } = state;
		(list[index] as ContactMembersType).is_selected = !(
			list[index] as ContactMembersType
		).is_selected;
		setState(prevState => ({ ...prevState, list }));
	};

	const renderCheckIcon = (isSelected: boolean) => {
		return (
			<List.Icon
				icon="check"
				color={isSelected ? config.colors.info : 'transparent'}
			/>
		);
	};

	const onSelectAll = () => {
		const { list, sortBy } = state;
		const notSelected = list.find(
			i =>
				i.role === sortBy &&
				(i.is_selected === undefined || i.is_selected === false),
		);

		if (notSelected) {
			list.forEach((item: ContactMembersType, index: number) => {
				if (sortBy === item.role) {
					(list[index] as ContactMembersType).is_selected = true;
				}
			});
		} else {
			list.map((item: ContactMembersType, index: number) =>
				sortBy === item.role
					? delete (list[index] as ContactMembersType).is_selected
					: null,
			);
		}

		setSelectAll(!selectAll);
		setState(prevState => ({ ...prevState, list }));
	};

	const handleToggleGroup = (index: number) => {
		const { groups } = state;

		const selectedMembers = groups[index]?.members;
		const selected = selectedMembers?.find(
			i => i.is_selected !== undefined && i.is_selected === true,
		);
		selectedMembers?.forEach((_member, memberIndex: number) => {
			if (selected) {
				delete selectedMembers[memberIndex]?.is_selected;
			} else {
				(
					selectedMembers[memberIndex] as ContactGroupMembersType
				).is_selected = true;
			}
		});

		(groups[index] as ContactGroupType).members = selectedMembers;
		setState(prevState => ({ ...prevState, groups }));
	};

	const handleToggleGroupContact = (
		groupIndex: number,
		contactIndex: number,
	) => {
		const { groups } = state;

		const updatedGroups = groups.map((a, gIndex) => {
			if (gIndex === groupIndex) {
				if (a.members) {
					const updatedMembers = a.members.map(
						(b: ContactGroupMembersType, cIndex) => {
							if (cIndex === contactIndex) {
								const updatedMember = {
									...b,
									is_selected: !b.is_selected,
								};
								return updatedMember;
							}
							return b;
						},
					);
					return { ...a, members: updatedMembers };
				}
			}
			return a;
		});

		setState(prevState => ({ ...prevState, groups: updatedGroups }));
	};

	const renderList = ({
		item,
		index,
	}: {
		item: ContactMembersType;
		index: number;
	}) => {
		const { sortBy } = state;

		if (sortBy !== 'all') {
			if (sortBy !== item.role) return null;
		}

		if (
			!item.fullname
				.toLowerCase()
				.includes(state.searchQuery.toLowerCase())
		)
			return null;

		return (
			<List.Item
				key={index}
				title={item.fullname}
				right={() => renderCheckIcon(item.is_selected as boolean)}
				onPress={() => handleToggleContact(index)}
				titleStyle={layout.fontMontserratRegular}
			/>
		);
	};

	const renderGroupList = (
		group: ContactGroupMembersType[],
		groupIndex: number,
	) => {
		if (group?.length) {
			return group.map((item, index) => {
				const fullname = `${item.first_name} ${item.last_name}`;
				return (
					<List.Item
						key={index}
						title={fullname}
						onPress={() =>
							handleToggleGroupContact(groupIndex, index)
						}
						right={() =>
							renderCheckIcon(item.is_selected as boolean)
						}
					/>
				);
			});
		}
		return null;
	};

	const renderGroupCheck = (selected: boolean) => {
		return (
			<List.Icon
				color={
					selected ? config.colors.info : config.backgrounds.lightgrey
				}
				icon="check-circle"
				style={{ paddingLeft: config.metrics.rg }}
			/>
		);
	};

	const renderGroups = ({
		item,
		index,
	}: {
		item: ContactGroupType;
		index: number;
	}) => {
		const hasSelected = item?.members?.find(
			i => i.is_selected !== undefined && i.is_selected === true,
		);

		return (
			<List.Accordion
				title={item.name}
				titleStyle={styles.groupTitleStyle}
				onPress={() => handleToggleGroup(index)}
				style={styles.groupAccordionStyle}
				expanded={!!hasSelected}
				left={() => renderGroupCheck(!!hasSelected)}
			>
				{renderGroupList(
					item.members as ContactGroupMembersType[],
					index,
				)}
			</List.Accordion>
		);
	};

	const renderContacts = () => {
		if (state.loading) {
			return (
				<View style={styles.loader}>
					<ActivityIndicator
						color={config.colors.brand}
						size="large"
					/>
				</View>
			);
		}
		if (state.sortBy !== 'group') {
			return (
				<FlatList
					data={state.list}
					renderItem={renderList}
					refreshing={state.refreshing}
					onRefresh={() => void getData(state.sortBy)}
				/>
			);
		}
		return (
			<FlatList
				data={state.groups}
				renderItem={renderGroups}
				refreshing={state.refreshing}
				onRefresh={() => void getData(state.sortBy)}
			/>
		);
	};

	return (
		<View style={layout.flex_1}>
			<Row>
				{Constant.SORT_OPTIONS.map((by, index) => {
					const tabBorder = {
						borderColor:
							by.value === state.sortBy ? 'black' : '#e5e5e5',
					};
					return (
						<TouchableOpacity
							key={index}
							style={{
								...tabBorder,
								...styles.tabStyle,
							}}
							onPress={() => handleTabPress(by.value)}
						>
							<Text>{by.name}</Text>
						</TouchableOpacity>
					);
				})}
			</Row>
			{!state.refreshing && state.sortBy !== 'group' && (
				<Searchbar
					placeholder="Search"
					onChangeText={search =>
						setState(prevState => ({
							...prevState,
							searchQuery: search,
						}))
					}
					value={state.searchQuery}
					style={styles.searchBar}
					inputStyle={styles.searchBarInput}
				/>
			)}

			{renderContacts()}
			{state.sortBy !== 'group' && (
				<TouchableOpacity
					style={styles.selectAllFloatBtn}
					activeOpacity={1}
					onPress={onSelectAll}
				>
					<Text size="rg" color="light">
						{selectAll ? 'Clear Selection' : 'Select All'}
					</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	tabStyle: {
		alignItems: 'center',
		flex: 1,
		paddingVertical: 15,
		borderBottomWidth: 2,
	},
	selectAllFloatBtn: {
		flexDirection: 'row',
		position: 'absolute',
		bottom: 25,
		right: 15,
		padding: 5,
		backgroundColor: config.colors.brand,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
		opacity: 0.7,
		paddingHorizontal: 13,
		paddingVertical: 8,
	},
	searchBar: { margin: config.metrics.md },
	searchBarInput: {
		fontSize: config.fonts.metrics.rg,
		...layout.fontMontserratRegular,
	},
	loader: { justifyContent: 'center', flex: 1 },
	groupTitleStyle: { color: '#222' },
	groupAccordionStyle: { padding: 0 },
});

export default ContactsScreen;
