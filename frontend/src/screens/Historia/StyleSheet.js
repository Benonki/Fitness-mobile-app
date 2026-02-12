import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    scrollView: {
        flex: 1,
    },
    modeSwitch: {
        flexDirection: 'row',
        backgroundColor: '#e8eaed',
        borderRadius: 25,
        padding: 4,
        marginBottom: 20,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 20,
    },
    modeButtonActive: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    modeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#A0A0A0',
    },
    modeButtonTextActive: {
        color: '#11D9EF',
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    pickerWrapper: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    dataCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dataRowLast: {
        borderBottomWidth: 0,
    },
    dataLabel: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    dataValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
    },
    dateInputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    dateInputWrapper: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        fontWeight: '500',
    },
    dateInput: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        justifyContent: 'center',
    },
    dateInputText: {
        fontSize: 16,
        color: '#333',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#A0A0A0',
        marginTop: 20,
        marginBottom: 15,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#A0A0A0',
        textAlign: 'center',
        lineHeight: 22,
    },
    emptyPeriod: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 30,
        alignItems: 'center',
    },
    emptyPeriodText: {
        fontSize: 16,
        color: '#A0A0A0',
        textAlign: 'center',
    },
});

export default styles;