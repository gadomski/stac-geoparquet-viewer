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
    const defaultRange = { min: 0, max: 100, step: 1, hasValidRange: false };
    
    const getExtent = () => {
      if (picked) {
        const ext = extractTemporalExtent(picked);
        if (ext) return { start: ext.start, end: ext.end };
      }
      if (dateRange.startDate && dateRange.endDate) {
        return { start: dateRange.startDate, end: dateRange.endDate };
      }
      if (value) {
        const ext = extractTemporalExtent(value);
        if (ext) return { start: ext.start, end: ext.end };
      }
      return null;
    };

    const extent = getExtent();
    if (!extent) return defaultRange;

    const min = extent.start.getTime();
    const max = extent.end.getTime();
    const duration = max - min;
    
    if (duration <= 0) return defaultRange;
    
    const step = Math.max(1, Math.min(3600000, Math.floor(duration / 1000)));
    
    return { min, max, step, hasValidRange: true };
  }, [value, picked, dateRange]);

  const windowSize = useMemo(() => {
    if (!sliderRange.hasValidRange) return 86400000; // 24h
    return Math.max(3600000, (sliderRange.max - sliderRange.min) / 20);
  }, [sliderRange]);

  const currentSliderValues = useMemo(() => {
    if (!sliderRange.hasValidRange) return [sliderRange.min, sliderRange.min + 86400000];
    
    const { startDate, endDate } = clientFilterDateRange;
    if (!startDate && !endDate) return [sliderRange.min, sliderRange.max];
    
    const start = Math.max(sliderRange.min, Math.min(sliderRange.max - 1, startDate?.getTime() || sliderRange.min));
    const end = Math.max(start + 1, Math.min(sliderRange.max, endDate?.getTime() || start + windowSize));
    
    return [start, end];
  }, [sliderRange, clientFilterDateRange, windowSize]);

  const [dateInputs, setDateInputs] = useState({ start: "", end: "" });
  const [prevSliderValues, setPrevSliderValues] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (sliderRange.hasValidRange) {
      setDateInputs({
        start: new Date(clientFilterDateRange.startDate?.getTime() || sliderRange.min).toISOString().split("T")[0],
        end: new Date(clientFilterDateRange.endDate?.getTime() || sliderRange.max).toISOString().split("T")[0],
      });
    }
  }, [sliderRange, clientFilterDateRange]);

  const handleSliderChange = (values: number[]) => {
    if (!sliderRange.hasValidRange || values.length !== 2) return;
    
    let [start, end] = values;
    const minDistance = sliderRange.step;
    
    if (end - start < minDistance) {
      if (prevSliderValues) {
        const [prevStart, prevEnd] = prevSliderValues;
        if (Math.abs(start - prevStart) > Math.abs(end - prevEnd)) {
          end = start + minDistance;
        } else {
          start = end - minDistance;
        }
      }
    }
    
    start = Math.max(sliderRange.min, Math.min(sliderRange.max - minDistance, start));
    end = Math.max(start + minDistance, Math.min(sliderRange.max, end));
    
    setPrevSliderValues([start, end]);
    setClientFilterDateRange({
      startDate: new Date(start),
      endDate: new Date(end),
      startTime: undefined,
      endTime: undefined,
    });
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    setDateInputs(prev => ({ ...prev, [type]: value }));
    if (!value || !sliderRange.hasValidRange) return;
    
    const date = new Date(value);
    const isStart = type === 'start';
    
    setClientFilterDateRange({
      startDate: isStart ? date : (clientFilterDateRange.startDate || new Date(date.getTime() - windowSize)),
      endDate: isStart ? (clientFilterDateRange.endDate || new Date(date.getTime() + windowSize)) : date,
      startTime: undefined,
      endTime: undefined,
    });
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });

  const formatDuration = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (!sliderRange.hasValidRange) {
    return (
      <Box p={4} borderWidth={1} borderRadius="md" bg="white" borderColor="gray.200" shadow="sm">
        <Text fontSize="sm" color="gray.500">No temporal data available</Text>
      </Box>
    );
  }

  const windowRange = {
    min: new Date(sliderRange.min).toISOString().split("T")[0],
    max: new Date(sliderRange.max).toISOString().split("T")[0],
  };

  return (
    <VStack gap={3} align="stretch" p={4} borderWidth={1} borderRadius="md" bg="white" borderColor="gray.200" shadow="sm">
      <HStack justify="space-between">
        <HStack>
          <LuCalendar />
          <Text fontSize="sm" fontWeight="medium">{title}</Text>
        </HStack>
        {isClientFilterActive && (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <IconButton size="sm" variant="ghost" colorScheme="red" onClick={clearClientFilterDateRange} aria-label="Clear filter">
                <LuX />
              </IconButton>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content>Clear filter</Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
        )}
      </HStack>

      {description && <Text fontSize="xs" color="gray.600">{description}</Text>}

      <VStack gap={2} align="stretch">
        <Text fontSize="xs" fontWeight="medium">Window Range</Text>
        <HStack gap={2}>
          {(['start', 'end'] as const).map(type => (
            <VStack key={type} gap={1} align="stretch" flex={1}>
              <Text fontSize="xs" color="gray.600">{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              <Input
                type="date"
                size="sm"
                value={dateInputs[type]}
                onChange={(e) => handleDateChange(type, e.target.value)}
                min={windowRange.min}
                max={windowRange.max}
              />
            </VStack>
          ))}
        </HStack>
      </VStack>

      <HStack justify="space-between" fontSize="xs" color="gray.600">
        <Text>{formatDate(sliderRange.min)}</Text>
        <Text>Range: {formatDuration(currentSliderValues[1] - currentSliderValues[0])}</Text>
        <Text>{formatDate(sliderRange.max)}</Text>
      </HStack>

      <Box px={2}>
        <Slider.Root
          value={currentSliderValues}
          min={sliderRange.min}
          max={sliderRange.max}
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
      </Box>

      <HStack justify="space-between" fontSize="xs">
        <Text color="gray.600">Current:</Text>
        <Text fontWeight="medium">
          {clientFilterDateRange.startDate && clientFilterDateRange.endDate
            ? `${formatDate(clientFilterDateRange.startDate.getTime())} - ${formatDate(clientFilterDateRange.endDate.getTime())}`
            : "Full range"}
        </Text>
      </HStack>

      {!isClientFilterActive && <Text fontSize="xs" color="blue.600" fontWeight="medium">Full range selected</Text>}
    </VStack>
  );
}