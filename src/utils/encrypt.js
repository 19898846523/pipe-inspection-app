import JSEncrypt from 'jsencrypt'

/**
 * 使用 RSA 公钥加密明文密码
 * @param {String} plainText 需要加密的明文（如用户输入的密码）
 * @param {String} publicKey 后端接口返回的公钥字符串
 * @returns {String|Boolean} 加密后的密文（Base64 字符串），如果加密失败返回 false
 */
export function encryptRSA(plainText, publicKey) {
  if (!plainText || !publicKey) {
    console.error('加密失败：明文或公钥不能为空')
    return false
  }

  // 实例化 JSEncrypt 对象
  const encryptor = new JSEncrypt()

  // 设置公钥
  // 提示：你截图中后端返回的公钥是纯 Base64 字符串 (MIGf...)
  // JSEncrypt 通常能直接识别，但如果后续发现加密后后端依然解密失败，
  // 可以尝试解开下面两行注释，手动加上 RSA 密钥的头尾标识：
  // publicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`

  encryptor.setPublicKey(publicKey)

  // 对明文进行加密
  const encryptedText = encryptor.encrypt(plainText)

  if (!encryptedText) {
    console.error('加密过程发生错误，可能是公钥格式不正确')
  }

  return encryptedText
}

export default {
  encryptRSA
}