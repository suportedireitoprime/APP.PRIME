---
name: kotlin-e-swift
description: Skill especialista em criar Pontes Nativas (Custom Capacitor Plugins) escrevendo diretamente em Kotlin (Android) e Swift (iOS). Use para migrar partes do código Web para processamento nativo.
---

# Skill: Kotlin & Swift (Capacitor Native Bridges)

Esta skill orienta a criação de funcionalidades 100% nativas dentro de um projeto Capacitor (React/TypeScript), escrevendo código diretamente em Kotlin para Android e Swift para iOS.

## O que esta skill faz?
Quando acionada, ela guia o assistente (você) a converter lógicas ou funcionalidades pesadas do TypeScript para as linguagens nativas de cada plataforma, usando o conceito de **Custom Capacitor Plugins**.

## Etapas Obrigatórias para Aplicar a Skill:

### 1. Pesquisa e Documentação Oficial
Antes de escrever o código nativo:
- Consulte obrigatoriamente a documentação do [Capacitor Custom Plugins](https://capacitorjs.com/docs/plugins/creating-plugins).
- Se a funcionalidade interagir com o sistema (UI, sensores, arquivos), consulte as documentações da [Apple (Swift/iOS)](https://developer.apple.com/) e do [Google (Kotlin/Android)](https://developer.android.com/).

### 2. Criação do Plugin no TypeScript
Crie a interface e o registro do plugin na pasta `src/lib/` ou `src/plugins/`:
```typescript
import { registerPlugin } from '@capacitor/core';

export interface MeuPluginNativoInterface {
  inicializar(options: { mensagem: string }): Promise<{ sucesso: boolean }>;
}

export const MeuPluginNativo = registerPlugin<MeuPluginNativoInterface>('MeuPluginNativo');
```

### 3. Implementação em Kotlin (Android)
Navegue até a pasta `android/app/src/main/java/[seu_pacote]/`.
Crie a classe do plugin e não se esqueça de registrá-lo na `MainActivity.java` se estiver usando Capacitor < 3, ou usar a anotação `@CapacitorPlugin` (Capacitor 3+).
Exemplo:
```kotlin
package com.suportedireitoprime.app

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "MeuPluginNativo")
class MeuPluginNativo : Plugin() {
    @PluginMethod
    fun inicializar(call: PluginCall) {
        val mensagem = call.getString("mensagem") ?: ""
        // Lógica Kotlin de alta performance aqui!
        
        val ret = JSObject()
        ret.put("sucesso", true)
        call.resolve(ret)
    }
}
```
**Importante:** Atualize `MainActivity.java` para registrar o plugin: `registerPlugin(MeuPluginNativo.class);` (se necessário).

### 4. Implementação em Swift e Objective-C (iOS)
Navegue até `ios/App/App/`. Você precisará criar **dois arquivos**:

**1. O arquivo Swift (`MeuPluginNativo.swift`):**
```swift
import Capacitor

@objc(MeuPluginNativo)
public class MeuPluginNativo: CAPPlugin {
    @objc func inicializar(_ call: CAPPluginCall) {
        let mensagem = call.getString("mensagem") ?? ""
        // Lógica Swift de alta performance aqui!
        
        call.resolve([
            "sucesso": true
        ])
    }
}
```

**2. O arquivo Objective-C (`MeuPluginNativo.m`) para expor ao Capacitor:**
```objc
import <Capacitor/Capacitor.h>

CAP_PLUGIN(MeuPluginNativo, "MeuPluginNativo",
    CAP_PLUGIN_METHOD(inicializar, CAPPluginReturnPromise);
)
```

### 5. Aplicação no Início do Aplicativo (App.tsx / main.tsx)
Sempre que criar a ponte, garanta que ela está sendo chamada no ciclo de vida do React para comprovar seu funcionamento nativo.
