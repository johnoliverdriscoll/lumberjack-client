'use strict'
const debug = require('debug')('lumberjack-client')
const net = require('net')
const pako = require('pako')
const tls = require('tls')
const typeforce = require('typeforce')

class LumberjackClient {

  constructor(config, useTls) {
    typeforce(typeforce.tuple(
      typeforce.Object,
      typeforce.maybe(typeforce.Boolean),
    ), arguments)
    Object.assign(this, {
      config: {...config},
      useTls,
      queue: [],
    })
    if (this.config.host && this.config.port) {
      connect.call(this)
    }
  }

  log(data) {
    typeforce(typeforce.tuple(
      typeforce.Object,
    ), arguments)
    if (this.connected) {
      send.call(this, [map(data)])
    } else if (this.connecting) {
      this.queue.push(map(data))
    }
  }

}

function connect() {
  this.connecting = true
  const cb = () => {
    debug('connected to logstash')
    this.connecting = false
    this.connected = true
    flush.call(this)
  }
  if (this.useTls) {
    this.socket = tls.connect(this.config, cb)
  } else {
    this.socket = net.connect(this.config, cb)
  }
  this.socket.on('error', (err) => {
    debug('logstash socket error: %o', err.message)
    this.connecting = false
    this.connected = false
    if (this.socket) {
      this.socket.destroy()
    }
    delete this.socket
  })
  this.socket.on('end', () => {
    debug('logstash server ended connection')
  })
  this.socket.on('close', () => {
    this.connected = false
    if (!this.connecting) {
      setTimeout(connect.bind(this))
    }
  })
}

function map(data) {
  return JSON.stringify(data)
}

function flush() {
  if (this.queue.length) {
    debug('flushing logstash messages')
    send.call(this, this.queue)
    this.queue.splice(0, this.queue.length)
  }
}

function send(messages) {
  const windowSize = Buffer.alloc(4)
  windowSize.writeUInt32BE(messages.length)
  const compressed = pako.deflate(messages.reduce((packets, message, index) => {
    const sequence = Buffer.alloc(4)
    const payload = Buffer.from(message)
    const payloadLen = Buffer.alloc(4)
    sequence.writeUInt32BE(index + 1)
    payloadLen.writeUInt32BE(payload.length)
    return Buffer.concat([
      packets, 
      Buffer.from('2J'),
      sequence,
      payloadLen,
      payload,
    ])
  }, Buffer.alloc(0)))
  const compressedLen = Buffer.alloc(4)
  compressedLen.writeUInt32BE(compressed.length)
  this.socket.write(Buffer.concat([
    Buffer.from('2W'),
    windowSize,
    Buffer.from('2C'),
    compressedLen,
    compressed,
  ]))
}

module.exports = LumberjackClient
