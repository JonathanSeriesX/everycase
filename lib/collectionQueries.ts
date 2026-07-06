"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

// Client data layer for the collection feature: every /api/collection and
// /api/devices call goes through these hooks so components share one cache.
// Query keys: ["collection", sku] for one case's status, ["devices", sku]
// for the owned + compatible device lists (sku "" = owned only). Mutations
// invalidate both roots — the server is always the source of truth after a
// write; optimistic bits live with the mutations below.

export type CollectionStatus = "owned" | "wanted" | null;

export interface DeviceOption {
  deviceId: string;
  model: string;
  colour: string;
  thumbnail: string;
}

export interface DevicesPayload {
  /** Devices the user owns (all of them, regardless of sku). */
  devices: DeviceOption[];
  /** Devices the given sku's case fits — empty without a sku. */
  compatible: DeviceOption[];
}

export const collectionKeys = {
  collection: ["collection"] as const,
  status: (sku: string) => ["collection", sku] as const,
  devices: (sku = "") => ["devices", sku] as const,
};

async function requestJSON<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

const putJSON = <T,>(input: string, body: unknown) =>
  requestJSON<T>(input, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

/** This case's status in the signed-in user's collection. */
export function useCaseStatus(sku: string, enabled: boolean) {
  return useQuery({
    queryKey: collectionKeys.status(sku),
    queryFn: () =>
      requestJSON<{ items: { sku: string; status: CollectionStatus }[] }>(
        `/api/collection?skus=${encodeURIComponent(sku)}`,
      ).then((data) => data.items[0]?.status ?? null),
    enabled,
  });
}

/** The user's devices plus the ones this case is compatible with. */
export function useDevices(sku: string, enabled: boolean) {
  return useQuery({
    queryKey: collectionKeys.devices(sku),
    queryFn: () =>
      requestJSON<DevicesPayload>(
        `/api/devices?sku=${encodeURIComponent(sku)}`,
      ),
    enabled,
  });
}

/** Invalidate everything collection-shaped after any write. */
export function useInvalidateCollection() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: collectionKeys.collection });
    void queryClient.invalidateQueries({ queryKey: collectionKeys.devices() });
  };
}

/**
 * Set (or clear, with null) one case's status. Optimistic: the cached
 * status flips immediately and rolls back on failure.
 */
export function useSetCaseStatus(
  sku: string,
  options?: Pick<
    UseMutationOptions<unknown, Error, CollectionStatus>,
    "onError" | "onSuccess"
  >,
) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCollection();
  return useMutation({
    mutationFn: (status: CollectionStatus) =>
      status
        ? putJSON("/api/collection", { sku, status })
        : requestJSON(`/api/collection?sku=${encodeURIComponent(sku)}`, {
            method: "DELETE",
          }),
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: collectionKeys.status(sku) });
      const previous = queryClient.getQueryData<CollectionStatus>(
        collectionKeys.status(sku),
      );
      queryClient.setQueryData(collectionKeys.status(sku), status);
      return { previous };
    },
    onError: (error, status, context) => {
      queryClient.setQueryData(
        collectionKeys.status(sku),
        context?.previous ?? null,
      );
      options?.onError?.(error, status, context, undefined as never);
    },
    onSuccess: options?.onSuccess,
    onSettled: invalidate,
  });
}

/** Register a device (optionally replacing another — the colour swap). */
export function useAddDevice(
  options?: Pick<
    UseMutationOptions<
      unknown,
      Error,
      { deviceId: string; replaceDeviceId?: string }
    >,
    "onError" | "onSuccess"
  >,
) {
  const invalidate = useInvalidateCollection();
  return useMutation({
    mutationFn: (body: { deviceId: string; replaceDeviceId?: string }) =>
      putJSON("/api/devices", body),
    onError: options?.onError,
    onSuccess: options?.onSuccess,
    onSettled: invalidate,
  });
}

/** Remove one device; its cases stay and simply stop grouping under it. */
export function useRemoveDevice(
  options?: Pick<
    UseMutationOptions<unknown, Error, string>,
    "onError" | "onSuccess"
  >,
) {
  const invalidate = useInvalidateCollection();
  return useMutation({
    mutationFn: (deviceId: string) =>
      requestJSON(`/api/devices?deviceId=${encodeURIComponent(deviceId)}`, {
        method: "DELETE",
      }),
    onError: options?.onError,
    onSuccess: options?.onSuccess,
    onSettled: invalidate,
  });
}

/** Remove one case from the collection (the tile Remove buttons). */
export function useRemoveCase(
  options?: Pick<
    UseMutationOptions<unknown, Error, string>,
    "onError" | "onSuccess"
  >,
) {
  const invalidate = useInvalidateCollection();
  return useMutation({
    mutationFn: (sku: string) =>
      requestJSON(`/api/collection?sku=${encodeURIComponent(sku)}`, {
        method: "DELETE",
      }),
    onError: options?.onError,
    onSuccess: options?.onSuccess,
    onSettled: invalidate,
  });
}
