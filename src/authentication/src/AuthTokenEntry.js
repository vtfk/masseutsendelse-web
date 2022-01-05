module.exports = class AuthTokenEntry {
  constructor(provider, type, token, expiration) {
    this.provider = provider;
    this.type = type;
    this.expiration = expiration;
    this.token = token;
  }
}