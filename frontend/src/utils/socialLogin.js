/**
 * Solo habilita proveedores confirmados por la API; una carga pendiente,
 * fallida o incompleta nunca autoriza la navegación hacia un proveedor.
 */
export function isSocialProviderReady(providers, providerId, status) {
  return (
    status === "ready" &&
    Array.isArray(providers) &&
    providers.some(
      (provider) => provider?.id === providerId && provider.configured === true,
    )
  );
}
