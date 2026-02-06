/**
 * Cross-platform date picker modal (Expo / React Native recommended pattern).
 *
 * @react-native-community/datetimepicker only supports iOS and Android.
 * Expo does not ship a built-in date picker for web. The recommended approach
 * is this platform-specific wrapper:
 * - iOS/Android: native DateTimePicker (system UI)
 * - Web: HTML <input type="date"> (browser native picker)
 *
 * See: https://docs.expo.dev/versions/latest/sdk/date-time-picker/
 * See: https://github.com/react-native-datetimepicker/datetimepicker
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
} from "react-native";

// DateTimePicker will be loaded lazily in the component to avoid module loading issues

function dateToYyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type DatePickerModalProps = {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  /** Button labels (default: French) */
  cancelLabel?: string;
  confirmLabel?: string;
};

export function DatePickerModal({
  visible,
  value,
  onConfirm,
  onCancel,
  cancelLabel = "Annuler",
  confirmLabel = "Choisir",
}: DatePickerModalProps) {
  const [pickerDate, setPickerDate] = useState(value);

  useEffect(() => {
    if (visible) {
      setPickerDate(value);
    }
  }, [visible, value]);

  const onPickerChange = (_event: unknown, date?: Date) => {
    if (date) {
      setPickerDate(date);
      if (Platform.OS === "android") {
        onConfirm(date);
      }
    } else if (Platform.OS === "android") {
      onCancel();
    }
  };

  const handleConfirm = () => {
    onConfirm(pickerDate);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onCancel}
        />
        <View style={styles.modal}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
          {Platform.OS === "web" ? (
            <View
              style={styles.webInputWrapper}
              onStartShouldSetResponder={() => true}
            >
              <TextInput
                value={dateToYyyyMmDd(pickerDate)}
                onChangeText={(t) => {
                  if (t && /^\d{4}-\d{2}-\d{2}$/.test(t)) {
                    setPickerDate(new Date(t + "T12:00:00"));
                  }
                }}
                style={styles.webInput}
                // @ts-expect-error - type="date" is valid on web input
                type="date"
              />
            </View>
          ) : (
            (() => {
              try {
                const DateTimePicker =
                  // eslint-disable-next-line @typescript-eslint/no-require-imports
                  require("@react-native-community/datetimepicker").default;
                return (
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onPickerChange}
                    locale="fr-FR"
                  />
                );
              } catch {
                return null;
              }
            })()
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingBottom: Platform.OS === "ios" ? 0 : 16,
    minWidth: 280,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cancelText: {
    fontSize: 16,
    color: "#666",
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0055a4",
  },
  webInputWrapper: {
    padding: 16,
    minHeight: 120,
  },
  webInput: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    ...(Platform.OS === "web" && { width: "100%" as const }),
  },
});

// Default export for Expo Router compatibility (component is used as named export)
export default DatePickerModal;
