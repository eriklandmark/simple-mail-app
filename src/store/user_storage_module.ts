import Vue from "vue"
import {Module} from "vuex";
import fs from "fs"
import path from "path"
import electron from "electron"
import {sortKeys} from "googleapis/build/src/generator/download";

export function createUserStorage(keys: string[], options: { saveTo: "fs" | "local", always_save: boolean } = {
    saveTo: "local",
    always_save: true
}): Module<any, any> {
    const log = (msg: string) => console.log("[USER STORAGE]", msg)

    return {
        namespaced: true,
        state: {
            device_type: "desktop",
            deviceReadyActivated: false
        },

        getters: {
            keys() {
                return keys
            },

            storage_path(state) {
                if (state.device_type === "desktop") {
                    return path.join(electron.remote.app.getAppPath(), "storage", "data.json")
                }
            }
        },
        actions: {
            async init({state, getters, rootState}) {
                if (options.saveTo === "local") {
                    for (const key of getters.keys) {
                        const storage_key = "user_storage." + key
                        if (localStorage.getItem(storage_key)) {
                            Vue.set(state, key, JSON.parse(localStorage.getItem(storage_key)!))
                        }
                    }
                } else if (options.saveTo == "fs") {
                    if (fs.existsSync(getters.storage_path)) {
                        const data = JSON.parse(fs.readFileSync(getters.storage_path, {encoding: "utf-8"}))
                        Object.keys(data).forEach((key) => Vue.set(rootState, key, data[key]))
                    }
                }

                log("Loaded user storage!")
            },

            async save(store, payload = null) {
                if (options.saveTo === "local") {
                    for (const [key, data] of Object.entries(payload))
                        localStorage.setItem("user_storage." + key, JSON.stringify(data))
                } else if (options.saveTo === "fs") {
                    const object: any = {}
                    keys.forEach((key) => object[key] = store.rootState[key])
                    const data = JSON.stringify(object)
                    if (store.state.device_type === "unknown") {

                    } else if (store.state.device_type === "desktop") {
                        if (!fs.existsSync(path.dirname(store.getters.storage_path)))
                            fs.mkdirSync(path.dirname(store.getters.storage_path))
                        fs.writeFileSync(store.getters.storage_path, data, {encoding: "utf-8"})
                    }
                }
            }
        }
    }
}