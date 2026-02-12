import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { LineChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import styles from './StyleSheet.js';
import { UserContext } from '../../context/UserContext';

const HistoriaScreen = () => {
    const { user } = useContext(UserContext);
    const [history, setHistory] = useState([]);
    const [viewMode, setViewMode] = useState('daily'); // 'daily' albo 'period'
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState({ start: '', end: '' });
    const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
    const [chartType, setChartType] = useState('weight');

    useEffect(() => {
        if (user?.history) {
            setHistory(user.history);
            if (user.history.length > 0) {
                setSelectedDate(formatDateForDisplay(user.history[user.history.length - 1].date));
            }
        }
    }, [user]);

    const showStartDatePicker = () => setStartDatePickerVisible(true);
    const hideStartDatePicker = () => setStartDatePickerVisible(false);
    const showEndDatePicker = () => setEndDatePickerVisible(true);
    const hideEndDatePicker = () => setEndDatePickerVisible(false);

    const handleStartDateConfirm = (date) => {
        const formattedDate = date.toLocaleDateString('pl-PL');
        hideStartDatePicker();

        if (selectedPeriod.end) {
            const startDate = new Date(date);
            const endDate = new Date(selectedPeriod.end.split('.').reverse().join('-'));

            if (startDate > endDate) {
                Alert.alert('Błąd', 'Data początkowa nie może być późniejsza niż data końcowa');
                return;
            }
        }

        setSelectedPeriod(prev => ({ ...prev, start: formattedDate }));
    };

    const handleEndDateConfirm = (date) => {
        const formattedDate = date.toLocaleDateString('pl-PL');
        hideEndDatePicker();

        if (selectedPeriod.start) {
            const startDate = new Date(selectedPeriod.start.split('.').reverse().join('-'));
            const endDate = new Date(date);

            if (endDate < startDate) {
                Alert.alert('Błąd', 'Data końcowa nie może być wcześniejsza niż data początkowa');
                return;
            }
        }

        setSelectedPeriod(prev => ({ ...prev, end: formattedDate }));
    };

    const formatDateForDisplay = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const parseDateFromHistory = (dateString) => {
        return new Date(dateString);
    };

    const getDailyEntry = () => {
        return history.find(entry => formatDateForDisplay(entry.date) === selectedDate);
    };

    const getPeriodData = () => {
        if (!selectedPeriod.start || !selectedPeriod.end) return [];

        const startDate = parseDateFromHistory(selectedPeriod.start.split('.').reverse().join('-'));
        const endDate = parseDateFromHistory(selectedPeriod.end.split('.').reverse().join('-'));

        return history.filter(entry => {
            const entryDate = parseDateFromHistory(entry.date);
            return entryDate >= startDate && entryDate <= endDate;
        }).sort((a, b) => parseDateFromHistory(a.date) - parseDateFromHistory(b.date));
    };

    const generateChartData = () => {
        const periodData = getPeriodData();

        if (periodData.length === 0) {
            return {
                labels: [],
                datasets: [{ data: [] }]
            };
        }

        const labels = periodData.map(entry => {
            const date = parseDateFromHistory(entry.date);
            return `${date.getDate()}.${date.getMonth() + 1}`;
        });

        const data = periodData.map(entry => {
            switch (chartType) {
                case 'weight': return entry.weight;
                case 'sumOfCalories': return entry.sumOfCalories;
                case 'numberOfSteps': return entry.numberOfSteps;
                case 'numberOfExercises': return entry.numberOfExercises;
                case 'height': return entry.height;
                default: return 0;
            }
        });

        return {
            labels,
            datasets: [{ data }]
        };
    };

    const getChartTitle = () => {
        const titles = {
            weight: 'Waga (kg)',
            sumOfCalories: 'Suma Kalorii (kcal)',
            numberOfSteps: 'Ilość Kroków',
            numberOfExercises: 'Ilość Treningów',
            height: 'Wzrost (cm)'
        };
        return titles[chartType] || 'Wykres';
    };

    const screenWidth = Dimensions.get('window').width - 40;

    if (!history || history.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <MaterialIcons name="info-outline" size={64} color="#A0A0A0" />
                    <Text style={styles.emptyStateTitle}>Brak historii</Text>
                    <Text style={styles.emptyStateText}>
                        Twoja historia danych będzie dostępna po pierwszym resecie dziennym.
                        Nowe wpisy są tworzone automatycznie przy każdym logowaniu.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.modeSwitch}>
                <TouchableOpacity
                    style={[
                        styles.modeButton,
                        viewMode === 'daily' && styles.modeButtonActive
                    ]}
                    onPress={() => setViewMode('daily')}
                >
                    <Text style={[
                        styles.modeButtonText,
                        viewMode === 'daily' && styles.modeButtonTextActive
                    ]}>
                        Dzień
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.modeButton,
                        viewMode === 'period' && styles.modeButtonActive
                    ]}
                    onPress={() => setViewMode('period')}
                >
                    <Text style={[
                        styles.modeButtonText,
                        viewMode === 'period' && styles.modeButtonTextActive
                    ]}>
                        Okres
                    </Text>
                </TouchableOpacity>
            </View>

            {viewMode === 'daily' ? (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Wybierz dzień</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={selectedDate}
                                style={styles.picker}
                                onValueChange={(itemValue) => setSelectedDate(itemValue)}
                            >
                                {history.map((entry, index) => (
                                    <Picker.Item
                                        key={index}
                                        label={formatDateForDisplay(entry.date)}
                                        value={formatDateForDisplay(entry.date)}
                                    />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    {getDailyEntry() && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Dane z dnia {selectedDate}</Text>
                            <View style={styles.dataCard}>
                                <View style={styles.dataRow}>
                                    <Text style={styles.dataLabel}>Waga:</Text>
                                    <Text style={styles.dataValue}>{getDailyEntry().weight} kg</Text>
                                </View>
                                <View style={styles.dataRow}>
                                    <Text style={styles.dataLabel}>Wzrost:</Text>
                                    <Text style={styles.dataValue}>{getDailyEntry().height} cm</Text>
                                </View>
                                <View style={styles.dataRow}>
                                    <Text style={styles.dataLabel}>Suma kalorii:</Text>
                                    <Text style={styles.dataValue}>{getDailyEntry().sumOfCalories} kcal</Text>
                                </View>
                                <View style={styles.dataRow}>
                                    <Text style={styles.dataLabel}>Ilość kroków:</Text>
                                    <Text style={styles.dataValue}>{getDailyEntry().numberOfSteps}</Text>
                                </View>
                                <View style={styles.dataRow}>
                                    <Text style={styles.dataLabel}>Ilość treningów:</Text>
                                    <Text style={styles.dataValue}>{getDailyEntry().numberOfExercises}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>
            ) : (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Wybierz okres</Text>

                        <View style={styles.dateInputRow}>
                            <View style={styles.dateInputWrapper}>
                                <Text style={styles.dateLabel}>Od:</Text>
                                <TouchableOpacity
                                    style={styles.dateInput}
                                    onPress={showStartDatePicker}
                                >
                                    <Text style={styles.dateInputText}>
                                        {selectedPeriod.start || 'Wybierz datę'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dateInputWrapper}>
                                <Text style={styles.dateLabel}>Do:</Text>
                                <TouchableOpacity
                                    style={styles.dateInput}
                                    onPress={showEndDatePicker}
                                >
                                    <Text style={styles.dateInputText}>
                                        {selectedPeriod.end || 'Wybierz datę'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <DateTimePickerModal
                            isVisible={isStartDatePickerVisible}
                            mode="date"
                            onConfirm={handleStartDateConfirm}
                            onCancel={hideStartDatePicker}
                        />
                        <DateTimePickerModal
                            isVisible={isEndDatePickerVisible}
                            mode="date"
                            onConfirm={handleEndDateConfirm}
                            onCancel={hideEndDatePicker}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Typ wykresu</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={chartType}
                                style={styles.picker}
                                onValueChange={(itemValue) => setChartType(itemValue)}
                            >
                                <Picker.Item label="Waga" value="weight" />
                                <Picker.Item label="Suma Kalorii" value="sumOfCalories" />
                                <Picker.Item label="Ilość Kroków" value="numberOfSteps" />
                                <Picker.Item label="Ilość Treningów" value="numberOfExercises" />
                                <Picker.Item label="Wzrost" value="height" />
                            </Picker>
                        </View>
                    </View>

                    {selectedPeriod.start && selectedPeriod.end && getPeriodData().length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{getChartTitle()}</Text>
                            <LineChart
                                data={generateChartData()}
                                width={screenWidth}
                                height={220}
                                chartConfig={{
                                    backgroundColor: '#ffffff',
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#ffffff',
                                    decimalPlaces: chartType === 'weight' ? 1 : 0,
                                    color: (opacity = 1) => `rgba(29, 161, 242, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    style: {
                                        borderRadius: 16
                                    },
                                    propsForDots: {
                                        r: '4',
                                        strokeWidth: '2',
                                        stroke: '#1DA1F2'
                                    }
                                }}
                                bezier
                                style={styles.chart}
                            />
                        </View>
                    )}

                    {selectedPeriod.start && selectedPeriod.end && getPeriodData().length === 0 && (
                        <View style={styles.emptyPeriod}>
                            <Text style={styles.emptyPeriodText}>
                                Brak danych dla wybranego okresu
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
};

export default HistoriaScreen;