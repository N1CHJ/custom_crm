import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, DollarSign, GripVertical } from 'lucide-react';
import { dealsApi } from '../services/api';
import toast from 'react-hot-toast';
import type { Deal } from '../types';
import DealModal from '../components/deals/DealModal';
import { useAppStore } from '../stores/appStore';
import { useState } from 'react';

export default function Pipeline() {
  const queryClient = useQueryClient();
  const { isDealModalOpen, setDealModalOpen, editingDeal, setEditingDeal } = useAppStore();
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => dealsApi.getPipeline(),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) => dealsApi.updateStage(id, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      toast.success('Deal moved successfully');
    },
    onError: () => {
      toast.error('Failed to move deal');
    },
  });

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedDeal && draggedDeal.stage_id !== stageId) {
      updateStageMutation.mutate({ id: draggedDeal.id, stageId });
    }
    setDraggedDeal(null);
  };

  const handleDragEnd = () => {
    setDraggedDeal(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const totalValue = data?.pipeline?.reduce((sum, stage) => sum + stage.totalValue, 0) || 0;
  const totalDeals = data?.pipeline?.reduce((sum, stage) => sum + stage.deals.length, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalDeals} deals • ${totalValue.toLocaleString()} total value
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/deals"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            List View
          </Link>
          <button
            onClick={() => {
              setEditingDeal(null);
              setDealModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add Deal
          </button>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {data?.pipeline?.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Stage Header */}
            <div className="mb-3 flex items-center justify-between rounded-lg bg-gray-100 p-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="font-medium text-gray-900">{stage.name}</span>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {stage.deals.length}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-500">
                ${stage.totalValue.toLocaleString()}
              </span>
            </div>

            {/* Stage Cards */}
            <div className="space-y-2 min-h-[200px] rounded-lg bg-gray-50 p-2">
              {stage.deals.map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, deal)}
                  onDragEnd={handleDragEnd}
                  className={`group cursor-grab rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${
                    draggedDeal?.id === deal.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100" />
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/deals/${deal.id}`}
                        className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {deal.name}
                      </Link>
                      {deal.company_name && (
                        <p className="mt-1 text-xs text-gray-500 truncate">
                          {deal.company_name}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          {deal.value.toLocaleString()}
                        </span>
                        {deal.contact_first_name && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-600">
                            {deal.contact_first_name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {stage.deals.length === 0 && (
                <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">No deals</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Deal Modal */}
      <DealModal
        isOpen={isDealModalOpen}
        onClose={() => {
          setDealModalOpen(false);
          setEditingDeal(null);
        }}
        deal={editingDeal}
      />
    </div>
  );
}
