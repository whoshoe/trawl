export function useDocsUrl() {
  const url = shallowRef("http://localhost:3001")

  onMounted(() => {
    const { protocol, hostname } = window.location
    if (hostname === "localhost" || hostname === "127.0.0.1") url.value = "http://localhost:3001"
    else url.value = `${protocol}//docs.${hostname}`
  })

  return url
}
