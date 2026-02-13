import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FeeMode } from '../../backend';

type PricingMode = 'free' | 'perEvent' | 'basePlusAdditional' | 'allEventsFlat';

interface CompetitionPricingFieldsProps {
  value?: FeeMode;
  onChange: (feeMode?: FeeMode) => void;
}

export default function CompetitionPricingFields({ value, onChange }: CompetitionPricingFieldsProps) {
  const [mode, setMode] = useState<PricingMode>('free');
  const [perEventFee, setPerEventFee] = useState('');
  const [baseFee, setBaseFee] = useState('');
  const [additionalFee, setAdditionalFee] = useState('');
  const [allEventsFlat, setAllEventsFlat] = useState('');

  // Initialize from value prop
  useEffect(() => {
    if (!value) {
      setMode('free');
      return;
    }

    if ('__kind__' in value) {
      if (value.__kind__ === 'perEvent') {
        setMode('perEvent');
        setPerEventFee(value.perEvent.toString());
      } else if (value.__kind__ === 'basePlusAdditional') {
        setMode('basePlusAdditional');
        setBaseFee(value.basePlusAdditional.baseFee.toString());
        setAdditionalFee(value.basePlusAdditional.additionalFee.toString());
      } else if (value.__kind__ === 'allEventsFlat') {
        setMode('allEventsFlat');
        setAllEventsFlat(value.allEventsFlat.toString());
      }
    }
  }, [value]);

  // Update parent when values change
  useEffect(() => {
    let newFeeMode: FeeMode | undefined;

    switch (mode) {
      case 'free':
        newFeeMode = undefined;
        break;
      case 'perEvent':
        if (perEventFee && Number(perEventFee) > 0) {
          newFeeMode = { __kind__: 'perEvent', perEvent: BigInt(perEventFee) };
        }
        break;
      case 'basePlusAdditional':
        if (baseFee && additionalFee && Number(baseFee) > 0) {
          newFeeMode = {
            __kind__: 'basePlusAdditional',
            basePlusAdditional: {
              baseFee: BigInt(baseFee),
              additionalFee: BigInt(additionalFee),
            },
          };
        }
        break;
      case 'allEventsFlat':
        if (allEventsFlat && Number(allEventsFlat) > 0) {
          newFeeMode = { __kind__: 'allEventsFlat', allEventsFlat: BigInt(allEventsFlat) };
        }
        break;
    }

    onChange(newFeeMode);
  }, [mode, perEventFee, baseFee, additionalFee, allEventsFlat, onChange]);

  const handleModeChange = (newMode: PricingMode) => {
    setMode(newMode);
    // Clear all fee fields when mode changes
    setPerEventFee('');
    setBaseFee('');
    setAdditionalFee('');
    setAllEventsFlat('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pricingMode">Pricing Mode</Label>
        <Select value={mode} onValueChange={handleModeChange}>
          <SelectTrigger id="pricingMode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free Competition</SelectItem>
            <SelectItem value="perEvent">Per Event Fee</SelectItem>
            <SelectItem value="basePlusAdditional">Base + Additional Event Fee</SelectItem>
            <SelectItem value="allEventsFlat">All Events Flat Fee</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === 'perEvent' && (
        <div className="space-y-2">
          <Label htmlFor="perEventFee">Fee per Event (INR)</Label>
          <Input
            id="perEventFee"
            type="number"
            min="0"
            value={perEventFee}
            onChange={(e) => setPerEventFee(e.target.value)}
            placeholder="Enter fee amount"
            required
          />
          <p className="text-sm text-muted-foreground">
            Users pay this amount for each event they participate in
          </p>
        </div>
      )}

      {mode === 'basePlusAdditional' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="baseFee">Base Fee for First Event (INR)</Label>
            <Input
              id="baseFee"
              type="number"
              min="0"
              value={baseFee}
              onChange={(e) => setBaseFee(e.target.value)}
              placeholder="Enter base fee"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="additionalFee">Additional Fee per Extra Event (INR)</Label>
            <Input
              id="additionalFee"
              type="number"
              min="0"
              value={additionalFee}
              onChange={(e) => setAdditionalFee(e.target.value)}
              placeholder="Enter additional fee"
              required
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Users pay the base fee for their first event, then the additional fee for each subsequent event
          </p>
        </div>
      )}

      {mode === 'allEventsFlat' && (
        <div className="space-y-2">
          <Label htmlFor="allEventsFlat">Flat Fee for All Events (INR)</Label>
          <Input
            id="allEventsFlat"
            type="number"
            min="0"
            value={allEventsFlat}
            onChange={(e) => setAllEventsFlat(e.target.value)}
            placeholder="Enter flat fee"
            required
          />
          <p className="text-sm text-muted-foreground">
            Users pay once and can participate in all events
          </p>
        </div>
      )}
    </div>
  );
}
