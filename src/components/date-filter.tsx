import {
  Alert,
  Button,
  ButtonGroup,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuCalendar, LuX } from "react-icons/lu";
import { DATE_FILTER_PRESETS, isValidDateRange } from "../utils/date-filter";

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  startTime?: string; // HH:mm format
  endTime?: string; // HH:mm format
}

export interface DateFilterPreset {
  id: string;
  label: string;
  getDateRange: () => DateRange;
}

interface DateFilterProps {
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
  clearDateRange: () => void;
  isDateFilterActive: boolean;
  title?: string;
  description?: string;
}

export default function DateFilter({
  dateRange,
  setDateRange,
  clearDateRange,
  isDateFilterActive,
  title = "Date & Time Filter",
  description,
}: DateFilterProps) {
  const handlePresetSelect = (preset: (typeof DATE_FILTER_PRESETS)[0]) => {
    setDateRange(preset.getDateRange());
  };

  const handleCustomDateChange = (
    field: keyof DateRange,
    value: Date | string | null,
  ) => {
    setDateRange({ ...dateRange, [field]: value });
  };

  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    setDateRange({ ...dateRange, [field]: value || undefined });
  };

  return (
    <VStack
      gap={4}
      align="stretch"
      p={4}
      borderWidth={1}
      borderRadius="md"
      bg="white"
      shadow="sm"
    >
      <HStack justify="space-between" align="center">
        <HStack>
          <LuCalendar />
          <Text fontSize="sm" fontWeight="medium">
            {title}
          </Text>
        </HStack>
        {isDateFilterActive && (
          <Button
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={clearDateRange}
          >
            <LuX /> Clear
          </Button>
        )}
      </HStack>

      {description && (
        <Text fontSize="xs" color="gray.600">
          {description}
        </Text>
      )}

      <VStack gap={3} align="stretch">
        <Text fontSize="sm" fontWeight="medium">
          Quick Presets
        </Text>
        <ButtonGroup size="sm" variant="outline" flexWrap="wrap">
          {DATE_FILTER_PRESETS.map((preset) => (
            <Button key={preset.id} onClick={() => handlePresetSelect(preset)}>
              {preset.label}
            </Button>
          ))}
        </ButtonGroup>

        <Text fontSize="sm" fontWeight="medium">
          Custom Range
        </Text>
        <VStack gap={3} align="stretch">
          {/* Start Date and Time */}
          <VStack align="stretch" gap={2}>
            <Text fontSize="xs" fontWeight="medium">
              Start Date & Time
            </Text>
            <HStack gap={2}>
              <Input
                type="date"
                size="sm"
                flex={1}
                value={dateRange.startDate?.toISOString().split("T")[0] || ""}
                onChange={(e) =>
                  handleCustomDateChange(
                    "startDate",
                    e.target.value ? new Date(e.target.value) : null,
                  )
                }
              />
              <Input
                type="time"
                size="sm"
                flex={1}
                value={dateRange.startTime || ""}
                onChange={(e) => handleTimeChange("startTime", e.target.value)}
              />
            </HStack>
          </VStack>

          <VStack align="stretch" gap={2}>
            <Text fontSize="xs" fontWeight="medium">
              End Date & Time
            </Text>
            <HStack gap={2}>
              <Input
                type="date"
                size="sm"
                flex={1}
                value={dateRange.endDate?.toISOString().split("T")[0] || ""}
                onChange={(e) =>
                  handleCustomDateChange(
                    "endDate",
                    e.target.value ? new Date(e.target.value) : null,
                  )
                }
              />
              <Input
                type="time"
                size="sm"
                flex={1}
                value={dateRange.endTime || ""}
                onChange={(e) => handleTimeChange("endTime", e.target.value)}
              />
            </HStack>
          </VStack>
        </VStack>

        {!isValidDateRange(dateRange) && (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>
                Start date/time must be before or equal to end date/time
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {isDateFilterActive && (
          <Text fontSize="xs" color="green.600" fontWeight="medium">
            ✓ Date & time filter is active
          </Text>
        )}
      </VStack>
    </VStack>
  );
}
