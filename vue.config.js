module.exports = {
  publicPath: '',
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      externals: ["googleapis", "express", "imap-simple", "mailparser"]
    }
  }
}
