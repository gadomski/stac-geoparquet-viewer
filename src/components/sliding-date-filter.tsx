import {
  Box,
  HStack,
  Slider,
  SliderTrack,
  SliderRange,
  SliderThumb,
  Text,
  VStack,
  IconButton,
  Tooltip,
  Input,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";
import { LuCalendar, LuX } from "react-icons/lu";

import { extractTemporalExtent } from "../utils/date-filter";
import useStacMap from "../hooks/stac-map";

interface SlidingDateFilterProps {
  title?: string;
  description?: string;
}

export default function SlidingDateFilter({
  title = "Temporal Scrubber",
  description = "Scrub through the temporal range of loaded data",
}: SlidingDateFilterProps) {
  const {
    value,
    clientFilterDateRange,
    setClientFilterDateRange,
    clearClientFilterDateRange,
    isClientFilterActive,
    dateRange,
    picked,
  } = useStacMap();

  const sliderRange = useMemo(() => {
    if (!value && !picked) {
      return { min: 0, max: 100, step: 1, hasValidRange: false };
    }

    const createValidRange = (start: Date, end: Date) => {
      const min = start.getTime();
      const max = end.getTime();

      if (min >= max) {
        return { min: 0, max: 100, step: 1, hasValidRange: false };
      }

      const totalDuration = max - min;
      const step = Math.max(
        1,
        Math.min(60 * 60 * 1000, Math.floor(totalDuration / 1000)),
      );

      if (step <= 0 || step >= totalDuration) {
        return { min: 0, max: 100, step: 1, hasValidRange: false };
      }

      return {
        min,
        max,
        step,
        hasValidRange: true,
      };
    };

    if (picked) {
      const pickedTemporalExtent = extractTemporalExtent(picked);
      if (pickedTemporalExtent) {
        return createValidRange(
          pickedTemporalExtent.start,
          pickedTemporalExtent.end,
        );
      }
    }

    if (dateRange.startDate && dateRange.endDate) {
      return createValidRange(dateRange.startDate, dateRange.endDate);
    }

    if (value) {
      const temporalExtent = extractTemporalExtent(value);
      if (temporalExtent) {
        return createValidRange(temporalExtent.start, temporalExtent.end);
      }
    }

    return { min: 0, max: 100, step: 1, hasValidRange: false };
  }, [value, picked, dateRange]);

  const windowSize = useMemo(() => {
    if (!sliderRange.hasValidRange) return 24 * 60 * 60 * 1000;

    const totalDuration = sliderRange.max - sliderRange.min;
    return Math.max(60 * 60 * 1000, totalDuration / 20);
  }, [sliderRange]);

  const currentSliderValues = useMemo(() => {
    if (!sliderRange.hasValidRange) {
      const defaultWindowSize = 24 * 60 * 60 * 1000;
      return [sliderRange.min, sliderRange.min + defaultWindowSize];
    }

    if (!clientFilterDateRange.startDate && !clientFilterDateRange.endDate) {
      return [sliderRange.min, sliderRange.max];
    }

    let startValue =
      clientFilterDateRange.startDate?.getTime() || sliderRange.min;
    let endValue =
      clientFilterDateRange.endDate?.getTime() || startValue + windowSize;

    startValue = Math.max(
      sliderRange.min,
      Math.min(sliderRange.max - 1, startValue),
    );
    endValue = Math.max(startValue + 1, Math.min(sliderRange.max, endValue));

    if (
      startValue >= endValue ||
      startValue < sliderRange.min ||
      endValue > sliderRange.max
    ) {
      const midPoint =
        sliderRange.min + (sliderRange.max - sliderRange.min) / 2;
      const halfWindow = windowSize / 2;
      startValue = Math.max(sliderRange.min, midPoint - halfWindow);
      endValue = Math.min(sliderRange.max, startValue + windowSize);
    }

    return [startValue, endValue];
  }, [
    sliderRange,
    clientFilterDateRange.startDate,
    clientFilterDateRange.endDate,
    windowSize,
  ]);

  const [windowStartDate, setWindowStartDate] = useState<string>("");
  const [windowEndDate, setWindowEndDate] = useState<string>("");

  useEffect(() => {
    if (sliderRange.hasValidRange) {
      setWindowStartDate(new Date(sliderRange.min).toISOString().split("T")[0]);
      setWindowEndDate(new Date(sliderRange.max).toISOString().split("T")[0]);
    }
  }, [sliderRange]);

  useEffect(() => {
    if (clientFilterDateRange.startDate) {
      setWindowStartDate(
        clientFilterDateRange.startDate.toISOString().split("T")[0],
      );
    }
    if (clientFilterDateRange.endDate) {
      setWindowEndDate(
        clientFilterDateRange.endDate.toISOString().split("T")[0],
      );
    }
  }, [clientFilterDateRange]);

  const [visibleMin, setVisibleMin] = useState<number | null>(null);
  const [visibleMax, setVisibleMax] = useState<number | null>(null);
  const [previousSliderValues, setPreviousSliderValues] = useState<
    [number, number] | null
  >(null);

  useEffect(() => {
    if (sliderRange.hasValidRange) {
      const currentVisibleMin = visibleMin ?? sliderRange.min;
      const currentVisibleMax = visibleMax ?? sliderRange.max;

      if (
        currentVisibleMin < sliderRange.min ||
        currentVisibleMax > sliderRange.max ||
        currentVisibleMin >= currentVisibleMax
      ) {
        setVisibleMin(sliderRange.min);
        setVisibleMax(sliderRange.max);
      }
    } else {
      setVisibleMin(null);
      setVisibleMax(null);
    }
  }, [sliderRange, visibleMin, visibleMax]);

  useEffect(() => {
    if (
      sliderRange.hasValidRange &&
      clientFilterDateRange.startDate &&
      clientFilterDateRange.endDate
    ) {
      const clientStart = clientFilterDateRange.startDate.getTime();
      const clientEnd = clientFilterDateRange.endDate.getTime();

      if (clientStart < sliderRange.min || clientEnd > sliderRange.max) {
        clearClientFilterDateRange();
      }
    }
  }, [sliderRange, clientFilterDateRange, clearClientFilterDateRange]);

  const handleSliderChange = (values: number[]) => {
    if (!sliderRange.hasValidRange || values.length !== 2) return;

    let [startValue, endValue] = values;

    // ensure minimum distance between sliders
    const minDistance = sliderRange.step;
    if (endValue - startValue < minDistance) {
      if (previousSliderValues) {
        const [prevStart, prevEnd] = previousSliderValues;
        const startDiff = Math.abs(startValue - prevStart);
        const endDiff = Math.abs(endValue - prevEnd);

        if (startDiff > endDiff) {
          endValue = startValue + minDistance;
        } else {
          startValue = endValue - minDistance;
        }
      } else {
        if (startValue > endValue) {
          endValue = startValue + minDistance;
        } else {
          startValue = endValue - minDistance;
        }
      }
    }

    startValue = Math.max(
      sliderRange.min,
      Math.min(sliderRange.max - minDistance, startValue),
    );
    endValue = Math.max(
      startValue + minDistance,
      Math.min(sliderRange.max, endValue),
    );

    setPreviousSliderValues([startValue, endValue]);

    const startDate = new Date(startValue);
    const endDate = new Date(endValue);

    setClientFilterDateRange({
      startDate,
      endDate,
      startTime: undefined,
      endTime: undefined,
    });
  };

  const handleWindowStartDateChange = (dateString: string) => {
    setWindowStartDate(dateString);
    if (dateString && sliderRange.hasValidRange) {
      const startDate = new Date(dateString);
      const endDate =
        clientFilterDateRange.endDate ||
        new Date(startDate.getTime() + windowSize);

      setClientFilterDateRange({
        startDate,
        endDate,
        startTime: undefined,
        endTime: undefined,
      });
    }
  };

  const handleWindowEndDateChange = (dateString: string) => {
    setWindowEndDate(dateString);
    if (dateString && sliderRange.hasValidRange) {
      const endDate = new Date(dateString);
      const startDate =
        clientFilterDateRange.startDate ||
        new Date(endDate.getTime() - windowSize);

      setClientFilterDateRange({
        startDate,
        endDate,
        startTime: undefined,
        endTime: undefined,
      });
    }
  };

  const handleClear = () => {
    clearClientFilterDateRange();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const bgColor = "white";
  const borderColor = "gray.200";

  if (!sliderRange.hasValidRange) {
    return (
      <Box
        p={4}
        borderWidth={1}
        borderRadius="md"
        bg={bgColor}
        borderColor={borderColor}
        shadow="sm"
      >
        <Text fontSize="sm" color="gray.500">
          No temporal data available
        </Text>
      </Box>
    );
  }

  return (
    <VStack
      gap={3}
      align="stretch"
      p={4}
      borderWidth={1}
      borderRadius="md"
      bg={bgColor}
      borderColor={borderColor}
      shadow="sm"
    >
      <HStack justify="space-between" align="center">
        <HStack>
          <LuCalendar />
          <Text fontSize="sm" fontWeight="medium">
            {title}
          </Text>
        </HStack>
        {isClientFilterActive && (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <IconButton
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={handleClear}
                aria-label="Clear filter"
              >
                <LuX />
              </IconButton>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content>Clear filter</Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
        )}
      </HStack>

      {description && (
        <Text fontSize="xs" color="gray.600">
          {description}
        </Text>
      )}

      <VStack gap={2} align="stretch">
        <Text fontSize="xs" fontWeight="medium">
          Window Range
        </Text>
        <HStack gap={2}>
          <VStack gap={1} align="stretch" flex={1}>
            <Text fontSize="xs" color="gray.600">
              Start
            </Text>
            <Input
              type="date"
              size="sm"
              value={windowStartDate}
              onChange={(e) => handleWindowStartDateChange(e.target.value)}
              min={
                sliderRange.hasValidRange
                  ? new Date(sliderRange.min).toISOString().split("T")[0]
                  : undefined
              }
              max={
                sliderRange.hasValidRange
                  ? new Date(sliderRange.max).toISOString().split("T")[0]
                  : undefined
              }
              disabled={!sliderRange.hasValidRange}
            />
          </VStack>
          <VStack gap={1} align="stretch" flex={1}>
            <Text fontSize="xs" color="gray.600">
              End
            </Text>
            <Input
              type="date"
              size="sm"
              value={windowEndDate}
              onChange={(e) => handleWindowEndDateChange(e.target.value)}
              min={
                sliderRange.hasValidRange
                  ? new Date(sliderRange.min).toISOString().split("T")[0]
                  : undefined
              }
              max={
                sliderRange.hasValidRange
                  ? new Date(sliderRange.max).toISOString().split("T")[0]
                  : undefined
              }
              disabled={!sliderRange.hasValidRange}
            />
          </VStack>
        </HStack>
      </VStack>

      <HStack justify="space-between" fontSize="xs" color="gray.600">
        <Text>
          {sliderRange.hasValidRange ? formatDate(sliderRange.min) : "Invalid"}
        </Text>
        <Text>
          Range:{" "}
          {sliderRange.hasValidRange && currentSliderValues.length === 2
            ? formatDuration(currentSliderValues[1] - currentSliderValues[0])
            : "Invalid"}
        </Text>
        <Text>
          {sliderRange.hasValidRange ? formatDate(sliderRange.max) : "Invalid"}
        </Text>
      </HStack>

      <Box px={2}>
        {sliderRange.hasValidRange &&
        currentSliderValues.length === 2 &&
        currentSliderValues[0] < currentSliderValues[1] &&
        (visibleMin ?? sliderRange.min) < (visibleMax ?? sliderRange.max) &&
        sliderRange.step > 0 ? (
          <Slider.Root
            value={currentSliderValues}
            min={visibleMin ?? sliderRange.min}
            max={visibleMax ?? sliderRange.max}
            step={sliderRange.step}
            onValueChange={(details) => handleSliderChange(details.value)}
          >
            <Slider.Control>
              <SliderTrack>
                <SliderRange bg="blue.500" />
              </SliderTrack>
              <SliderThumb index={0} />
              <SliderThumb index={1} />
            </Slider.Control>
          </Slider.Root>
        ) : (
          <Box
            height="20px"
            bg="gray.100"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="xs" color="gray.500">
              Invalid date range
            </Text>
          </Box>
        )}
      </Box>

      <HStack justify="space-between" fontSize="xs">
        <Text color="gray.600">Current:</Text>
        <Text fontWeight="medium">
          {clientFilterDateRange.startDate && clientFilterDateRange.endDate
            ? `${formatDate(clientFilterDateRange.startDate.getTime())} - ${formatDate(clientFilterDateRange.endDate.getTime())}`
            : "Full range"}
        </Text>
      </HStack>

      {!isClientFilterActive && (
        <Text fontSize="xs" color="blue.600" fontWeight="medium">
          Full range selected
        </Text>
      )}
    </VStack>
  );
}
