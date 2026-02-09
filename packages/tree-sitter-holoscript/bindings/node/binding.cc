#include <napi.h>

extern "C" {
  extern const void *tree_sitter_holoscript();
}

namespace {

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports["name"] = Napi::String::New(env, "holoscript");
  auto language = Napi::External<void>::New(
    env,
    const_cast<void*>(tree_sitter_holoscript())
  );
  exports["language"] = language;
  return exports;
}

}  // namespace

NODE_API_MODULE(tree_sitter_holoscript_binding, Init)
