/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/wasabi_solana.json`.
 */
export type WasabiSolana = {
  "address": "spicyTHtbmarmUxwFSHYpA8G4uP2nRNq38RReMpoZ9c",
  "metadata": {
    "name": "wasabiSolana",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addCollateralToLongPosition",
      "discriminator": [
        243,
        29,
        95,
        148,
        101,
        65,
        18,
        181
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The wallet that owns the assets"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "ownerCurrencyAccount",
          "docs": [
            "The wallet's currency token account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "currency"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lpVault",
          "docs": [
            "The LP Vault that was borrowed from"
          ],
          "writable": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "vault",
          "docs": [
            "The LP Vault's token account"
          ],
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "position",
          "docs": [
            "The Position that is being edited"
          ],
          "writable": true
        },
        {
          "name": "pool",
          "docs": [
            "The LongPool that 'owns' the Position"
          ]
        },
        {
          "name": "currency",
          "docs": [
            "The mint of the asset that was borrowed"
          ],
          "relations": [
            "pool"
          ]
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "debtController",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  98,
                  116,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  108,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "interest",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "addCollateralToLongWithShares",
      "discriminator": [
        80,
        227,
        237,
        106,
        69,
        38,
        193,
        6
      ],
      "accounts": [
        {
          "name": "withdraw",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The key of the user that owns the assets"
              ],
              "signer": true
            },
            {
              "name": "ownerAssetAccount",
              "docs": [
                "The Owner's token account that holds the assets"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "assetTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "assetMint"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "ownerSharesAccount",
              "docs": [
                "The Owner's token account that stores share tokens"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "sharesTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "sharesMint"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "lpVault",
              "writable": true
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "assetMint"
            },
            {
              "name": "sharesMint",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "assetTokenProgram"
            },
            {
              "name": "sharesTokenProgram",
              "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
            },
            {
              "name": "eventAuthority",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      95,
                      95,
                      101,
                      118,
                      101,
                      110,
                      116,
                      95,
                      97,
                      117,
                      116,
                      104,
                      111,
                      114,
                      105,
                      116,
                      121
                    ]
                  }
                ]
              }
            },
            {
              "name": "program"
            }
          ]
        },
        {
          "name": "editPosition",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The wallet that owns the assets"
              ],
              "writable": true,
              "signer": true
            },
            {
              "name": "ownerCurrencyAccount",
              "docs": [
                "The wallet's currency token account"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "tokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "currency"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "lpVault",
              "docs": [
                "The LP Vault that was borrowed from"
              ],
              "writable": true,
              "relations": [
                "position"
              ]
            },
            {
              "name": "vault",
              "docs": [
                "The LP Vault's token account"
              ],
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "position",
              "docs": [
                "The Position that is being edited"
              ],
              "writable": true
            },
            {
              "name": "pool",
              "docs": [
                "The LongPool that 'owns' the Position"
              ]
            },
            {
              "name": "currency",
              "docs": [
                "The mint of the asset that was borrowed"
              ],
              "relations": [
                "pool"
              ]
            },
            {
              "name": "authority",
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "tokenProgram"
            }
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "interest",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "addCollateralToShortPosition",
      "discriminator": [
        160,
        157,
        226,
        209,
        112,
        148,
        163,
        22
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The wallet that owns the assets"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "ownerTargetCurrencyAccount",
          "docs": [
            "The account that holds the owner's target currency"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "position",
          "writable": true
        },
        {
          "name": "pool",
          "docs": [
            "The ShortPool that owns the Position"
          ]
        },
        {
          "name": "collateralVault",
          "docs": [
            "The collateral account that is the destination of the swap"
          ],
          "writable": true,
          "relations": [
            "position",
            "pool"
          ]
        },
        {
          "name": "collateral"
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "addCollateralToShortWithShares",
      "discriminator": [
        11,
        184,
        175,
        152,
        231,
        77,
        241,
        34
      ],
      "accounts": [
        {
          "name": "withdraw",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The key of the user that owns the assets"
              ],
              "signer": true
            },
            {
              "name": "ownerAssetAccount",
              "docs": [
                "The Owner's token account that holds the assets"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "assetTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "assetMint"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "ownerSharesAccount",
              "docs": [
                "The Owner's token account that stores share tokens"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "sharesTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "sharesMint"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "lpVault",
              "writable": true
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "assetMint"
            },
            {
              "name": "sharesMint",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "assetTokenProgram"
            },
            {
              "name": "sharesTokenProgram",
              "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
            },
            {
              "name": "eventAuthority",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      95,
                      95,
                      101,
                      118,
                      101,
                      110,
                      116,
                      95,
                      97,
                      117,
                      116,
                      104,
                      111,
                      114,
                      105,
                      116,
                      121
                    ]
                  }
                ]
              }
            },
            {
              "name": "program"
            }
          ]
        },
        {
          "name": "editPosition",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The wallet that owns the assets"
              ],
              "writable": true,
              "signer": true
            },
            {
              "name": "ownerTargetCurrencyAccount",
              "docs": [
                "The account that holds the owner's target currency"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "tokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "collateral"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "pool",
              "docs": [
                "The ShortPool that owns the Position"
              ]
            },
            {
              "name": "collateralVault",
              "docs": [
                "The collateral account that is the destination of the swap"
              ],
              "writable": true,
              "relations": [
                "position",
                "pool"
              ]
            },
            {
              "name": "collateral"
            },
            {
              "name": "authority",
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "tokenProgram"
            }
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "closeLongPositionCleanup",
      "discriminator": [
        236,
        126,
        131,
        200,
        139,
        73,
        242,
        222
      ],
      "accounts": [
        {
          "name": "closePositionCleanup",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The wallet that owns the assets"
              ],
              "writable": true,
              "relations": [
                "ownerPayoutAccount"
              ]
            },
            {
              "name": "ownerPayoutAccount",
              "writable": true
            },
            {
              "name": "pool",
              "docs": [
                "The Long or Short Pool that owns the Position"
              ]
            },
            {
              "name": "collateralVault",
              "docs": [
                "The collateral account that is the source of the swap"
              ],
              "relations": [
                "pool",
                "position"
              ]
            },
            {
              "name": "currencyVault",
              "docs": [
                "The token account that is the destination of the swap"
              ],
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "currency"
            },
            {
              "name": "collateral"
            },
            {
              "name": "closePositionRequest",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      99,
                      108,
                      111,
                      115,
                      101,
                      95,
                      112,
                      111,
                      115
                    ]
                  },
                  {
                    "kind": "account",
                    "path": "owner"
                  }
                ]
              }
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true
            },
            {
              "name": "lpVault",
              "writable": true,
              "relations": [
                "position"
              ]
            },
            {
              "name": "vault",
              "docs": [
                "The LP Vault's token account."
              ],
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "feeWallet",
              "writable": true
            },
            {
              "name": "liquidationWallet",
              "writable": true
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "currencyTokenProgram"
            },
            {
              "name": "collateralTokenProgram"
            }
          ]
        },
        {
          "name": "owner",
          "docs": [
            "The wallet that owns the assets"
          ],
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "closeLongPositionSetup",
      "discriminator": [
        102,
        103,
        253,
        46,
        205,
        139,
        171,
        162
      ],
      "accounts": [
        {
          "name": "closePositionSetup",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The wallet that owns the assets"
              ],
              "writable": true
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "pool",
              "docs": [
                "The pool that owns the Position"
              ]
            },
            {
              "name": "collateralVault",
              "docs": [
                "The collateral account that is the source of the swap"
              ],
              "writable": true,
              "relations": [
                "position",
                "pool"
              ]
            },
            {
              "name": "currencyVault",
              "docs": [
                "The token account that is the destination of the swap"
              ],
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "collateral"
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "closePositionRequest",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      99,
                      108,
                      111,
                      115,
                      101,
                      95,
                      112,
                      111,
                      115
                    ]
                  },
                  {
                    "kind": "account",
                    "path": "owner"
                  }
                ]
              }
            },
            {
              "name": "tokenProgram"
            },
            {
              "name": "systemProgram",
              "address": "11111111111111111111111111111111"
            },
            {
              "name": "sysvarInfo",
              "address": "Sysvar1nstructions1111111111111111111111111"
            }
          ]
        },
        {
          "name": "owner",
          "docs": [
            "The wallet that owns the assets"
          ],
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "interest",
          "type": "u64"
        },
        {
          "name": "executionFee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "closePosition",
      "discriminator": [
        123,
        134,
        81,
        0,
        49,
        68,
        98,
        98
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "closePosition",
          "accounts": [
            {
              "name": "owner",
              "writable": true,
              "relations": [
                "ownerPayoutAccount"
              ]
            },
            {
              "name": "ownerPayoutAccount",
              "writable": true
            },
            {
              "name": "lpVault",
              "writable": true,
              "relations": [
                "position"
              ]
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "pool"
            },
            {
              "name": "currencyVault",
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "collateralVault",
              "writable": true,
              "relations": [
                "pool",
                "position"
              ]
            },
            {
              "name": "currency"
            },
            {
              "name": "collateral"
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "feeWallet",
              "writable": true
            },
            {
              "name": "liquidationWallet",
              "writable": true
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "currencyTokenProgram"
            },
            {
              "name": "collateralTokenProgram"
            },
            {
              "name": "systemProgram",
              "address": "11111111111111111111111111111111"
            }
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "interest",
          "type": "u64"
        },
        {
          "name": "executionFee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "route",
          "type": {
            "defined": {
              "name": "route"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "closeShortPositionCleanup",
      "discriminator": [
        10,
        149,
        86,
        89,
        144,
        239,
        81,
        144
      ],
      "accounts": [
        {
          "name": "closePositionCleanup",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The wallet that owns the assets"
              ],
              "writable": true,
              "relations": [
                "ownerPayoutAccount"
              ]
            },
            {
              "name": "ownerPayoutAccount",
              "writable": true
            },
            {
              "name": "pool",
              "docs": [
                "The Long or Short Pool that owns the Position"
              ]
            },
            {
              "name": "collateralVault",
              "docs": [
                "The collateral account that is the source of the swap"
              ],
              "relations": [
                "pool",
                "position"
              ]
            },
            {
              "name": "currencyVault",
              "docs": [
                "The token account that is the destination of the swap"
              ],
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "currency"
            },
            {
              "name": "collateral"
            },
            {
              "name": "closePositionRequest",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      99,
                      108,
                      111,
                      115,
                      101,
                      95,
                      112,
                      111,
                      115
                    ]
                  },
                  {
                    "kind": "account",
                    "path": "owner"
                  }
                ]
              }
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true
            },
            {
              "name": "lpVault",
              "writable": true,
              "relations": [
                "position"
              ]
            },
            {
              "name": "vault",
              "docs": [
                "The LP Vault's token account."
              ],
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "feeWallet",
              "writable": true
            },
            {
              "name": "liquidationWallet",
              "writable": true
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "currencyTokenProgram"
            },
            {
              "name": "collateralTokenProgram"
            }
          ]
        },
        {
          "name": "owner",
          "docs": [
            "The wallet that owns the assets"
          ],
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "closeShortPositionSetup",
      "discriminator": [
        74,
        35,
        186,
        204,
        174,
        70,
        62,
        246
      ],
      "accounts": [
        {
          "name": "closePositionSetup",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The wallet that owns the assets"
              ],
              "writable": true
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "pool",
              "docs": [
                "The pool that owns the Position"
              ]
            },
            {
              "name": "collateralVault",
              "docs": [
                "The collateral account that is the source of the swap"
              ],
              "writable": true,
              "relations": [
                "position",
                "pool"
              ]
            },
            {
              "name": "currencyVault",
              "docs": [
                "The token account that is the destination of the swap"
              ],
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "collateral"
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "closePositionRequest",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      99,
                      108,
                      111,
                      115,
                      101,
                      95,
                      112,
                      111,
                      115
                    ]
                  },
                  {
                    "kind": "account",
                    "path": "owner"
                  }
                ]
              }
            },
            {
              "name": "tokenProgram"
            },
            {
              "name": "systemProgram",
              "address": "11111111111111111111111111111111"
            },
            {
              "name": "sysvarInfo",
              "address": "Sysvar1nstructions1111111111111111111111111"
            }
          ]
        },
        {
          "name": "owner",
          "docs": [
            "The wallet that owns the assets"
          ],
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "interest",
          "type": "u64"
        },
        {
          "name": "executionFee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "closeStopLossOrder",
      "discriminator": [
        214,
        161,
        131,
        205,
        8,
        41,
        170,
        54
      ],
      "accounts": [
        {
          "name": "closer",
          "writable": true,
          "signer": true
        },
        {
          "name": "trader",
          "writable": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "position"
        },
        {
          "name": "stopLossOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  112,
                  95,
                  108,
                  111,
                  115,
                  115,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "position"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "closeStrategy",
      "discriminator": [
        56,
        247,
        170,
        246,
        89,
        221,
        134,
        200
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "lpVault",
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "collateral",
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "strategy",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "lpVault"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "writable": true,
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "closeTakeProfitOrder",
      "discriminator": [
        130,
        181,
        238,
        115,
        203,
        161,
        106,
        14
      ],
      "accounts": [
        {
          "name": "closer",
          "writable": true,
          "signer": true
        },
        {
          "name": "trader",
          "writable": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "position"
        },
        {
          "name": "takeProfitOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  107,
                  101,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  116,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "position"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The key of the user that owns the assets"
          ],
          "signer": true
        },
        {
          "name": "ownerAssetAccount",
          "docs": [
            "The Owner's token account that holds the assets"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "assetTokenProgram"
              },
              {
                "kind": "account",
                "path": "assetMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "ownerSharesAccount",
          "docs": [
            "The Owner's token account that stores share tokens"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "sharesTokenProgram"
              },
              {
                "kind": "account",
                "path": "sharesMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lpVault",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "assetMint"
        },
        {
          "name": "sharesMint",
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "assetTokenProgram"
        },
        {
          "name": "sharesTokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "donate",
      "discriminator": [
        121,
        186,
        218,
        211,
        73,
        70,
        196,
        180
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The key of the address donating"
          ],
          "signer": true
        },
        {
          "name": "ownerAssetAccount",
          "docs": [
            "The Payer's token account that holds the assets"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "currency"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lpVault",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "currency"
        },
        {
          "name": "permission"
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "increaseLongPositionSetup",
      "discriminator": [
        192,
        83,
        234,
        53,
        87,
        233,
        121,
        249
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The wallet that owns the assets"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "ownerCurrencyAccount",
          "docs": [
            "The account that holds the owner's quote currency"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "currency"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lpVault",
          "docs": [
            "The LP Vault that the user will borrow from",
            "For long positions, this is the `currency` i.e. the `quote`"
          ]
        },
        {
          "name": "vault",
          "docs": [
            "The LP Vault's token account."
          ],
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "pool",
          "docs": [
            "The LongPool that owns the Position"
          ]
        },
        {
          "name": "collateralVault",
          "docs": [
            "The collateral account that is the destination of the swap"
          ],
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currencyVault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currency",
          "relations": [
            "position"
          ]
        },
        {
          "name": "collateral",
          "relations": [
            "position"
          ]
        },
        {
          "name": "openPositionRequest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  101,
                  110,
                  95,
                  112,
                  111,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "feeWallet",
          "writable": true
        },
        {
          "name": "debtController",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  98,
                  116,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  108,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "sysvarInfo",
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "downPayment",
          "type": "u64"
        },
        {
          "name": "principal",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "increaseShortPosition",
      "discriminator": [
        197,
        22,
        116,
        176,
        227,
        104,
        20,
        168
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "ownerTargetCurrencyAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "collateralTokenProgram"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lpVault"
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "pool"
        },
        {
          "name": "collateralVault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currencyVault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currency"
        },
        {
          "name": "collateral"
        },
        {
          "name": "position",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "feeWallet",
          "writable": true
        },
        {
          "name": "debtController",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  98,
                  116,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  108,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "currencyTokenProgram"
        },
        {
          "name": "collateralTokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "downPayment",
          "type": "u64"
        },
        {
          "name": "principal",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "route",
          "type": {
            "defined": {
              "name": "route"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "increaseShortPositionSetup",
      "discriminator": [
        91,
        77,
        250,
        204,
        185,
        50,
        57,
        133
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The wallet that owns the assets"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "ownerTargetCurrencyAccount",
          "docs": [
            "The account that holds the owner's target currency"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "collateralTokenProgram"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lpVault",
          "docs": [
            "The LP Vault that the user will borrow from"
          ]
        },
        {
          "name": "vault",
          "docs": [
            "The LP Vault's token account."
          ],
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "pool",
          "docs": [
            "The ShortPool that owns the Position"
          ]
        },
        {
          "name": "collateralVault",
          "docs": [
            "The collateral account that is the destination of the swap"
          ],
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currencyVault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currency",
          "relations": [
            "position"
          ]
        },
        {
          "name": "collateral",
          "relations": [
            "position"
          ]
        },
        {
          "name": "openPositionRequest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  101,
                  110,
                  95,
                  112,
                  111,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "feeWallet",
          "writable": true
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "currencyTokenProgram"
        },
        {
          "name": "collateralTokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "sysvarInfo",
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "downPayment",
          "type": "u64"
        },
        {
          "name": "principal",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "increaseShortWithShares",
      "discriminator": [
        57,
        192,
        77,
        39,
        27,
        250,
        67,
        193
      ],
      "accounts": [
        {
          "name": "withdraw",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The key of the user that owns the assets"
              ],
              "signer": true
            },
            {
              "name": "ownerAssetAccount",
              "docs": [
                "The Owner's token account that holds the assets"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "assetTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "assetMint"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "ownerSharesAccount",
              "docs": [
                "The Owner's token account that stores share tokens"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "sharesTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "sharesMint"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "lpVault",
              "writable": true
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "assetMint"
            },
            {
              "name": "sharesMint",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "assetTokenProgram"
            },
            {
              "name": "sharesTokenProgram",
              "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
            },
            {
              "name": "eventAuthority",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      95,
                      95,
                      101,
                      118,
                      101,
                      110,
                      116,
                      95,
                      97,
                      117,
                      116,
                      104,
                      111,
                      114,
                      105,
                      116,
                      121
                    ]
                  }
                ]
              }
            },
            {
              "name": "program"
            }
          ]
        },
        {
          "name": "editPosition",
          "accounts": [
            {
              "name": "owner",
              "writable": true,
              "signer": true
            },
            {
              "name": "ownerTargetCurrencyAccount",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "collateralTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "collateral"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "lpVault"
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "pool"
            },
            {
              "name": "collateralVault",
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "currencyVault",
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "currency"
            },
            {
              "name": "collateral"
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "feeWallet",
              "writable": true
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "currencyTokenProgram"
            },
            {
              "name": "collateralTokenProgram"
            },
            {
              "name": "systemProgram",
              "address": "11111111111111111111111111111111"
            }
          ]
        }
      ],
      "args": [
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "downPayment",
          "type": "u64"
        },
        {
          "name": "principal",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "route",
          "type": {
            "defined": {
              "name": "route"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "initDebtController",
      "discriminator": [
        172,
        194,
        252,
        22,
        192,
        99,
        107,
        1
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "superAdminPermission"
          ]
        },
        {
          "name": "superAdminPermission",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  101,
                  114,
                  95,
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "debtController",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  98,
                  116,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  108,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "maxApy",
          "type": "u64"
        },
        {
          "name": "maxLeverage",
          "type": "u64"
        },
        {
          "name": "liquidationFee",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initGlobalSettings",
      "discriminator": [
        26,
        145,
        50,
        219,
        79,
        83,
        76,
        209
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "globalSettings",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "superAdminPermission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  101,
                  114,
                  95,
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "initGlobalSettingsArgs"
            }
          }
        }
      ]
    },
    {
      "name": "initLongPool",
      "discriminator": [
        159,
        80,
        198,
        99,
        39,
        249,
        57,
        32
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "docs": [
            "The key that has permission to init the pool"
          ],
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "collateral"
        },
        {
          "name": "currency"
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  110,
                  103,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "collateral"
              },
              {
                "kind": "account",
                "path": "currency"
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "collateralTokenProgram"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "currencyVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "currencyTokenProgram"
              },
              {
                "kind": "account",
                "path": "currency"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "collateralTokenProgram"
        },
        {
          "name": "currencyTokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initLpVault",
      "discriminator": [
        40,
        247,
        24,
        8,
        152,
        98,
        18,
        220
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "docs": [
            "The key that has permission to init the vault"
          ],
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "lpVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "assetMint"
              }
            ]
          }
        },
        {
          "name": "assetMint"
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "lpVault"
              },
              {
                "kind": "account",
                "path": "assetTokenProgram"
              },
              {
                "kind": "account",
                "path": "assetMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "sharesMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "lpVault"
              },
              {
                "kind": "account",
                "path": "assetMint"
              }
            ]
          }
        },
        {
          "name": "sharesMetadata",
          "docs": [
            "CHECK"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "tokenMetadataProgram"
              },
              {
                "kind": "account",
                "path": "sharesMint"
              }
            ],
            "program": {
              "kind": "account",
              "path": "tokenMetadataProgram"
            }
          }
        },
        {
          "name": "assetTokenProgram"
        },
        {
          "name": "sharesTokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "tokenMetadataProgram",
          "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "sysvarInstructions"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "initLpVaultArgs"
            }
          }
        }
      ]
    },
    {
      "name": "initOrUpdatePermission",
      "discriminator": [
        37,
        146,
        26,
        135,
        136,
        179,
        81,
        150
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "superAdminPermission"
          ]
        },
        {
          "name": "superAdminPermission",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  101,
                  114,
                  95,
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "newAuthority"
        },
        {
          "name": "permission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "newAuthority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "initOrUpdatePermissionArgs"
            }
          }
        }
      ]
    },
    {
      "name": "initOrUpdateStopLossOrder",
      "discriminator": [
        168,
        23,
        101,
        53,
        199,
        27,
        117,
        188
      ],
      "accounts": [
        {
          "name": "trader",
          "writable": true,
          "signer": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "position"
        },
        {
          "name": "stopLossOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  112,
                  95,
                  108,
                  111,
                  115,
                  115,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "position"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "makerAmount",
          "type": "u64"
        },
        {
          "name": "takerAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initOrUpdateTakeProfitOrder",
      "discriminator": [
        161,
        122,
        216,
        144,
        217,
        226,
        195,
        236
      ],
      "accounts": [
        {
          "name": "trader",
          "writable": true,
          "signer": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "position"
        },
        {
          "name": "takeProfitOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  107,
                  101,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  116,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "position"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "makerAmount",
          "type": "u64"
        },
        {
          "name": "takerAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initShortPool",
      "discriminator": [
        111,
        161,
        186,
        109,
        81,
        16,
        11,
        234
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "docs": [
            "The key that has permission to init the pool"
          ],
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "collateral"
        },
        {
          "name": "currency"
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  111,
                  114,
                  116,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "collateral"
              },
              {
                "kind": "account",
                "path": "currency"
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "collateralTokenProgram"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "currencyVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "currencyTokenProgram"
              },
              {
                "kind": "account",
                "path": "currency"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "collateralTokenProgram"
        },
        {
          "name": "currencyTokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initStrategy",
      "discriminator": [
        154,
        74,
        215,
        216,
        229,
        204,
        141,
        241
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "The account that has permission to borrow from the vaults"
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "lpVault",
          "docs": [
            "The lp vault being borrowed from"
          ]
        },
        {
          "name": "vault",
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "currency",
          "docs": [
            "The mint of the asset held by the lp vault"
          ]
        },
        {
          "name": "collateral",
          "docs": [
            "The mint of the token received for staking the lp vault asset"
          ]
        },
        {
          "name": "strategy",
          "docs": [
            "The 'strategy'"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "lpVault"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "docs": [
            "The lp vault's collateral token account"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "liquidatePosition",
      "discriminator": [
        187,
        74,
        229,
        149,
        102,
        81,
        221,
        68
      ],
      "accounts": [
        {
          "name": "closePosition",
          "accounts": [
            {
              "name": "owner",
              "writable": true,
              "relations": [
                "ownerPayoutAccount"
              ]
            },
            {
              "name": "ownerPayoutAccount",
              "writable": true
            },
            {
              "name": "lpVault",
              "writable": true,
              "relations": [
                "position"
              ]
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "pool"
            },
            {
              "name": "currencyVault",
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "collateralVault",
              "writable": true,
              "relations": [
                "pool",
                "position"
              ]
            },
            {
              "name": "currency"
            },
            {
              "name": "collateral"
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "feeWallet",
              "writable": true
            },
            {
              "name": "liquidationWallet",
              "writable": true
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "currencyTokenProgram"
            },
            {
              "name": "collateralTokenProgram"
            },
            {
              "name": "systemProgram",
              "address": "11111111111111111111111111111111"
            }
          ]
        }
      ],
      "args": [
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "interest",
          "type": "u64"
        },
        {
          "name": "executionFee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "route",
          "type": {
            "defined": {
              "name": "route"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "liquidatePositionCleanup",
      "discriminator": [
        185,
        18,
        231,
        32,
        86,
        130,
        185,
        245
      ],
      "accounts": [
        {
          "name": "closePositionCleanup",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The wallet that owns the assets"
              ],
              "writable": true,
              "relations": [
                "ownerPayoutAccount"
              ]
            },
            {
              "name": "ownerPayoutAccount",
              "writable": true
            },
            {
              "name": "pool",
              "docs": [
                "The Long or Short Pool that owns the Position"
              ]
            },
            {
              "name": "collateralVault",
              "docs": [
                "The collateral account that is the source of the swap"
              ],
              "relations": [
                "pool",
                "position"
              ]
            },
            {
              "name": "currencyVault",
              "docs": [
                "The token account that is the destination of the swap"
              ],
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "currency"
            },
            {
              "name": "collateral"
            },
            {
              "name": "closePositionRequest",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      99,
                      108,
                      111,
                      115,
                      101,
                      95,
                      112,
                      111,
                      115
                    ]
                  },
                  {
                    "kind": "account",
                    "path": "owner"
                  }
                ]
              }
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true
            },
            {
              "name": "lpVault",
              "writable": true,
              "relations": [
                "position"
              ]
            },
            {
              "name": "vault",
              "docs": [
                "The LP Vault's token account."
              ],
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "feeWallet",
              "writable": true
            },
            {
              "name": "liquidationWallet",
              "writable": true
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "currencyTokenProgram"
            },
            {
              "name": "collateralTokenProgram"
            }
          ]
        }
      ],
      "args": []
    },
    {
      "name": "liquidatePositionSetup",
      "discriminator": [
        148,
        123,
        212,
        246,
        41,
        250,
        150,
        75
      ],
      "accounts": [
        {
          "name": "closePositionSetup",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The wallet that owns the assets"
              ],
              "writable": true
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "pool",
              "docs": [
                "The pool that owns the Position"
              ]
            },
            {
              "name": "collateralVault",
              "docs": [
                "The collateral account that is the source of the swap"
              ],
              "writable": true,
              "relations": [
                "position",
                "pool"
              ]
            },
            {
              "name": "currencyVault",
              "docs": [
                "The token account that is the destination of the swap"
              ],
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "collateral"
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "closePositionRequest",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      99,
                      108,
                      111,
                      115,
                      101,
                      95,
                      112,
                      111,
                      115
                    ]
                  },
                  {
                    "kind": "account",
                    "path": "owner"
                  }
                ]
              }
            },
            {
              "name": "tokenProgram"
            },
            {
              "name": "systemProgram",
              "address": "11111111111111111111111111111111"
            },
            {
              "name": "sysvarInfo",
              "address": "Sysvar1nstructions1111111111111111111111111"
            }
          ]
        }
      ],
      "args": [
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "interest",
          "type": "u64"
        },
        {
          "name": "executionFee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "openLongPosition",
      "discriminator": [
        246,
        23,
        177,
        9,
        228,
        202,
        219,
        38
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "ownerCurrencyAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "currency"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lpVault"
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "pool"
        },
        {
          "name": "currencyVault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "collateralVault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currency"
        },
        {
          "name": "collateral"
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "lpVault"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "feeWallet",
          "writable": true
        },
        {
          "name": "debtController",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  98,
                  116,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  108,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u16"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "downPayment",
          "type": "u64"
        },
        {
          "name": "principal",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "route",
          "type": {
            "defined": {
              "name": "route"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "openLongPositionCleanup",
      "discriminator": [
        11,
        66,
        242,
        14,
        3,
        49,
        56,
        187
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The wallet that owns the assets"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "docs": [
            "The LongPool that owns the Position"
          ]
        },
        {
          "name": "collateralVault",
          "docs": [
            "The collateral account that is the destination of the swap"
          ],
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currencyVault",
          "relations": [
            "pool"
          ]
        },
        {
          "name": "openPositionRequest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  101,
                  110,
                  95,
                  112,
                  111,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "openLongPositionSetup",
      "discriminator": [
        60,
        189,
        249,
        182,
        254,
        175,
        137,
        246
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The wallet that owns the assets"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "ownerCurrencyAccount",
          "docs": [
            "The account that holds the owner's quote currency"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "currency"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lpVault",
          "docs": [
            "The LP Vault that the user will borrow from",
            "For long positions, this is the `currency` i.e. the `quote`"
          ]
        },
        {
          "name": "vault",
          "docs": [
            "The LP Vault's token account."
          ],
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "pool",
          "docs": [
            "The LongPool that owns the Position"
          ]
        },
        {
          "name": "collateralVault",
          "docs": [
            "The collateral account that is the destination of the swap"
          ],
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currencyVault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currency"
        },
        {
          "name": "collateral"
        },
        {
          "name": "openPositionRequest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  101,
                  110,
                  95,
                  112,
                  111,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "lpVault"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "feeWallet",
          "writable": true
        },
        {
          "name": "debtController",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  98,
                  116,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  108,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "sysvarInfo",
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u16"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "downPayment",
          "type": "u64"
        },
        {
          "name": "principal",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "openLongWithShares",
      "discriminator": [
        48,
        63,
        152,
        90,
        98,
        119,
        24,
        91
      ],
      "accounts": [
        {
          "name": "withdraw",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The key of the user that owns the assets"
              ],
              "signer": true
            },
            {
              "name": "ownerAssetAccount",
              "docs": [
                "The Owner's token account that holds the assets"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "assetTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "assetMint"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "ownerSharesAccount",
              "docs": [
                "The Owner's token account that stores share tokens"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "sharesTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "sharesMint"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "lpVault",
              "writable": true
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "assetMint"
            },
            {
              "name": "sharesMint",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "assetTokenProgram"
            },
            {
              "name": "sharesTokenProgram",
              "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
            },
            {
              "name": "eventAuthority",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      95,
                      95,
                      101,
                      118,
                      101,
                      110,
                      116,
                      95,
                      97,
                      117,
                      116,
                      104,
                      111,
                      114,
                      105,
                      116,
                      121
                    ]
                  }
                ]
              }
            },
            {
              "name": "program"
            }
          ]
        },
        {
          "name": "openPosition",
          "accounts": [
            {
              "name": "owner",
              "writable": true,
              "signer": true
            },
            {
              "name": "ownerCurrencyAccount",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "tokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "currency"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "lpVault"
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "pool"
            },
            {
              "name": "currencyVault",
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "collateralVault",
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "currency"
            },
            {
              "name": "collateral"
            },
            {
              "name": "position",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      112,
                      111,
                      115,
                      105,
                      116,
                      105,
                      111,
                      110
                    ]
                  },
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "path": "lpVault"
                  },
                  {
                    "kind": "arg",
                    "path": "nonce"
                  }
                ]
              }
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "feeWallet",
              "writable": true
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "tokenProgram"
            },
            {
              "name": "systemProgram",
              "address": "11111111111111111111111111111111"
            }
          ]
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u16"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "downPayment",
          "type": "u64"
        },
        {
          "name": "principal",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "route",
          "type": {
            "defined": {
              "name": "route"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "openShortPosition",
      "discriminator": [
        101,
        142,
        41,
        201,
        192,
        88,
        35,
        165
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "ownerTargetCurrencyAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "collateralTokenProgram"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lpVault"
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "pool"
        },
        {
          "name": "collateralVault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currencyVault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currency"
        },
        {
          "name": "collateral"
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "lpVault"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "feeWallet",
          "writable": true
        },
        {
          "name": "debtController",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  98,
                  116,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  108,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "currencyTokenProgram"
        },
        {
          "name": "collateralTokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u16"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "downPayment",
          "type": "u64"
        },
        {
          "name": "principal",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "route",
          "type": {
            "defined": {
              "name": "route"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "openShortPositionCleanup",
      "discriminator": [
        113,
        235,
        232,
        167,
        155,
        67,
        98,
        97
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The wallet that owns the assets"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "position",
          "writable": true
        },
        {
          "name": "pool",
          "docs": [
            "The ShortPool that owns the Position"
          ]
        },
        {
          "name": "collateralVault",
          "docs": [
            "The collateral account that is the destination of the swap"
          ],
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currencyVault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currency"
        },
        {
          "name": "collateral"
        },
        {
          "name": "lpVault",
          "docs": [
            "The LP Vault that the user will borrow from"
          ],
          "relations": [
            "position"
          ]
        },
        {
          "name": "vault",
          "docs": [
            "The LP Vault's token account."
          ],
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "openPositionRequest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  101,
                  110,
                  95,
                  112,
                  111,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "debtController",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  98,
                  116,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  108,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "openShortPositionSetup",
      "discriminator": [
        187,
        109,
        2,
        81,
        8,
        62,
        169,
        195
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The wallet that owns the assets"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "ownerTargetCurrencyAccount",
          "docs": [
            "The account that holds the owner's target currency"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "collateralTokenProgram"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lpVault",
          "docs": [
            "The LP Vault that the user will borrow from"
          ]
        },
        {
          "name": "vault",
          "docs": [
            "The LP Vault's token account."
          ],
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "pool",
          "docs": [
            "The ShortPool that owns the Position"
          ]
        },
        {
          "name": "collateralVault",
          "docs": [
            "The collateral account that is the destination of the swap"
          ],
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currencyVault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currency"
        },
        {
          "name": "collateral"
        },
        {
          "name": "openPositionRequest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  101,
                  110,
                  95,
                  112,
                  111,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "lpVault"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "feeWallet",
          "writable": true
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "currencyTokenProgram"
        },
        {
          "name": "collateralTokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "sysvarInfo",
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u16"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "downPayment",
          "type": "u64"
        },
        {
          "name": "principal",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "openShortWithShares",
      "discriminator": [
        144,
        16,
        61,
        40,
        121,
        73,
        127,
        26
      ],
      "accounts": [
        {
          "name": "withdraw",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The key of the user that owns the assets"
              ],
              "signer": true
            },
            {
              "name": "ownerAssetAccount",
              "docs": [
                "The Owner's token account that holds the assets"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "assetTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "assetMint"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "ownerSharesAccount",
              "docs": [
                "The Owner's token account that stores share tokens"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "sharesTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "sharesMint"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "lpVault",
              "writable": true
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "assetMint"
            },
            {
              "name": "sharesMint",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "assetTokenProgram"
            },
            {
              "name": "sharesTokenProgram",
              "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
            },
            {
              "name": "eventAuthority",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      95,
                      95,
                      101,
                      118,
                      101,
                      110,
                      116,
                      95,
                      97,
                      117,
                      116,
                      104,
                      111,
                      114,
                      105,
                      116,
                      121
                    ]
                  }
                ]
              }
            },
            {
              "name": "program"
            }
          ]
        },
        {
          "name": "openPosition",
          "accounts": [
            {
              "name": "owner",
              "writable": true,
              "signer": true
            },
            {
              "name": "ownerTargetCurrencyAccount",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "collateralTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "collateral"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "lpVault"
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "pool"
            },
            {
              "name": "collateralVault",
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "currencyVault",
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "currency"
            },
            {
              "name": "collateral"
            },
            {
              "name": "position",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      112,
                      111,
                      115,
                      105,
                      116,
                      105,
                      111,
                      110
                    ]
                  },
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "pool"
                  },
                  {
                    "kind": "account",
                    "path": "lpVault"
                  },
                  {
                    "kind": "arg",
                    "path": "nonce"
                  }
                ]
              }
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "feeWallet",
              "writable": true
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "currencyTokenProgram"
            },
            {
              "name": "collateralTokenProgram"
            },
            {
              "name": "systemProgram",
              "address": "11111111111111111111111111111111"
            }
          ]
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u16"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "downPayment",
          "type": "u64"
        },
        {
          "name": "principal",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "route",
          "type": {
            "defined": {
              "name": "route"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "redeem",
      "discriminator": [
        184,
        12,
        86,
        149,
        70,
        196,
        97,
        225
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The key of the user that owns the assets"
          ],
          "signer": true
        },
        {
          "name": "ownerAssetAccount",
          "docs": [
            "The Owner's token account that holds the assets"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "assetTokenProgram"
              },
              {
                "kind": "account",
                "path": "assetMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "ownerSharesAccount",
          "docs": [
            "The Owner's token account that stores share tokens"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "sharesTokenProgram"
              },
              {
                "kind": "account",
                "path": "sharesMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lpVault",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "assetMint"
        },
        {
          "name": "sharesMint",
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "assetTokenProgram"
        },
        {
          "name": "sharesTokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "sharesAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "removePermission",
      "discriminator": [
        122,
        51,
        186,
        238,
        78,
        104,
        205,
        204
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "superAdminPermission"
          ]
        },
        {
          "name": "superAdminPermission"
        },
        {
          "name": "permission",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "setFeeWallet",
      "discriminator": [
        108,
        242,
        79,
        79,
        203,
        119,
        109,
        211
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "superAdminPermission"
          ]
        },
        {
          "name": "superAdminPermission",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  101,
                  114,
                  95,
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "globalSettings",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "feeWallet",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "setLiquidationFee",
      "discriminator": [
        23,
        215,
        203,
        90,
        133,
        247,
        235,
        183
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "superAdminPermission"
          ]
        },
        {
          "name": "superAdminPermission",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  101,
                  114,
                  95,
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "debtController",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  98,
                  116,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  108,
                  101,
                  114
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "liquidationFee",
          "type": "u8"
        }
      ]
    },
    {
      "name": "setLiquidationWallet",
      "discriminator": [
        177,
        5,
        36,
        205,
        72,
        178,
        234,
        5
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "superAdminPermission"
          ]
        },
        {
          "name": "superAdminPermission",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  101,
                  114,
                  95,
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "globalSettings",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "liquidationWallet",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "setLpState",
      "discriminator": [
        231,
        69,
        23,
        137,
        236,
        71,
        234,
        183
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "superAdmin"
          ]
        },
        {
          "name": "globalSettings",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "superAdmin",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  101,
                  114,
                  95,
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "allowLp",
          "type": "bool"
        }
      ]
    },
    {
      "name": "setMaxApy",
      "discriminator": [
        128,
        49,
        15,
        92,
        77,
        116,
        239,
        215
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "superAdminPermission"
          ]
        },
        {
          "name": "superAdminPermission",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  101,
                  114,
                  95,
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "debtController",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  98,
                  116,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  108,
                  101,
                  114
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "maxApy",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setMaxLeverage",
      "discriminator": [
        62,
        85,
        230,
        182,
        252,
        29,
        22,
        78
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "superAdminPermission"
          ]
        },
        {
          "name": "superAdminPermission",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  101,
                  114,
                  95,
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "debtController",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  98,
                  116,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  108,
                  101,
                  114
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "maxLeverage",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setSuperAdmin",
      "discriminator": [
        187,
        223,
        246,
        195,
        90,
        71,
        138,
        214
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "superAdminPermission"
          ]
        },
        {
          "name": "superAdminPermission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  101,
                  114,
                  95,
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newSuperAdmin",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "setTradingState",
      "discriminator": [
        108,
        117,
        127,
        219,
        149,
        140,
        254,
        8
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "superAdmin"
          ]
        },
        {
          "name": "globalSettings",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "superAdmin",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  112,
                  101,
                  114,
                  95,
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "allowTrading",
          "type": "bool"
        }
      ]
    },
    {
      "name": "stopLoss",
      "discriminator": [
        184,
        119,
        157,
        75,
        46,
        255,
        173,
        203
      ],
      "accounts": [
        {
          "name": "closePosition",
          "accounts": [
            {
              "name": "owner",
              "writable": true,
              "relations": [
                "ownerPayoutAccount"
              ]
            },
            {
              "name": "ownerPayoutAccount",
              "writable": true
            },
            {
              "name": "lpVault",
              "writable": true,
              "relations": [
                "position"
              ]
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "pool"
            },
            {
              "name": "currencyVault",
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "collateralVault",
              "writable": true,
              "relations": [
                "pool",
                "position"
              ]
            },
            {
              "name": "currency"
            },
            {
              "name": "collateral"
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "feeWallet",
              "writable": true
            },
            {
              "name": "liquidationWallet",
              "writable": true
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "currencyTokenProgram"
            },
            {
              "name": "collateralTokenProgram"
            },
            {
              "name": "systemProgram",
              "address": "11111111111111111111111111111111"
            }
          ]
        },
        {
          "name": "stopLossOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  112,
                  95,
                  108,
                  111,
                  115,
                  115,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "close_position.position",
                "account": "closePositionInternal"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "interest",
          "type": "u64"
        },
        {
          "name": "executionFee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "route",
          "type": {
            "defined": {
              "name": "route"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "stopLossCleanup",
      "discriminator": [
        144,
        144,
        88,
        99,
        168,
        160,
        122,
        175
      ],
      "accounts": [
        {
          "name": "closePositionCleanup",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The wallet that owns the assets"
              ],
              "writable": true,
              "relations": [
                "ownerPayoutAccount"
              ]
            },
            {
              "name": "ownerPayoutAccount",
              "writable": true
            },
            {
              "name": "pool",
              "docs": [
                "The Long or Short Pool that owns the Position"
              ]
            },
            {
              "name": "collateralVault",
              "docs": [
                "The collateral account that is the source of the swap"
              ],
              "relations": [
                "pool",
                "position"
              ]
            },
            {
              "name": "currencyVault",
              "docs": [
                "The token account that is the destination of the swap"
              ],
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "currency"
            },
            {
              "name": "collateral"
            },
            {
              "name": "closePositionRequest",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      99,
                      108,
                      111,
                      115,
                      101,
                      95,
                      112,
                      111,
                      115
                    ]
                  },
                  {
                    "kind": "account",
                    "path": "owner"
                  }
                ]
              }
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true
            },
            {
              "name": "lpVault",
              "writable": true,
              "relations": [
                "position"
              ]
            },
            {
              "name": "vault",
              "docs": [
                "The LP Vault's token account."
              ],
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "feeWallet",
              "writable": true
            },
            {
              "name": "liquidationWallet",
              "writable": true
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "currencyTokenProgram"
            },
            {
              "name": "collateralTokenProgram"
            }
          ]
        },
        {
          "name": "stopLossOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  112,
                  95,
                  108,
                  111,
                  115,
                  115,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "close_position_cleanup.position",
                "account": "closePositionCleanup"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "stopLossSetup",
      "discriminator": [
        50,
        67,
        192,
        202,
        66,
        50,
        233,
        44
      ],
      "accounts": [
        {
          "name": "closePositionSetup",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The wallet that owns the assets"
              ],
              "writable": true
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "pool",
              "docs": [
                "The pool that owns the Position"
              ]
            },
            {
              "name": "collateralVault",
              "docs": [
                "The collateral account that is the source of the swap"
              ],
              "writable": true,
              "relations": [
                "position",
                "pool"
              ]
            },
            {
              "name": "currencyVault",
              "docs": [
                "The token account that is the destination of the swap"
              ],
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "collateral"
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "closePositionRequest",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      99,
                      108,
                      111,
                      115,
                      101,
                      95,
                      112,
                      111,
                      115
                    ]
                  },
                  {
                    "kind": "account",
                    "path": "owner"
                  }
                ]
              }
            },
            {
              "name": "tokenProgram"
            },
            {
              "name": "systemProgram",
              "address": "11111111111111111111111111111111"
            },
            {
              "name": "sysvarInfo",
              "address": "Sysvar1nstructions1111111111111111111111111"
            }
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "interest",
          "type": "u64"
        },
        {
          "name": "executionFee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "strategyClaimYield",
      "discriminator": [
        50,
        156,
        7,
        45,
        45,
        214,
        42,
        200
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "lpVault",
          "writable": true,
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "collateral",
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "strategy",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "lpVault"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newQuote",
          "type": "u64"
        }
      ]
    },
    {
      "name": "strategyDepositCleanup",
      "discriminator": [
        33,
        245,
        91,
        164,
        12,
        88,
        147,
        174
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "The account that has permission to borrow from the vaults"
          ],
          "signer": true
        },
        {
          "name": "lpVault",
          "docs": [
            "The lp vault being borrowed from"
          ],
          "writable": true,
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "vault",
          "docs": [
            "The token account for the asset which the lp vault holds"
          ],
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "collateral",
          "docs": [
            "The mint of the token that will be received for staking the vault asset"
          ],
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "strategyRequest",
          "docs": [
            "Temporary 'cache' account to store the state of the stake request between instructions"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121,
                  95,
                  114,
                  101,
                  113,
                  117,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "strategy"
              }
            ]
          }
        },
        {
          "name": "strategy",
          "docs": [
            "The account that holds the strategy's state"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "lpVault"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "docs": [
            "The lp vault's collateral token account"
          ],
          "writable": true,
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "strategyDepositSetup",
      "discriminator": [
        38,
        134,
        220,
        229,
        48,
        210,
        179,
        67
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "The account that has permission to borrow from the vaults"
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "lpVault",
          "docs": [
            "The lp vault being borrowed from"
          ],
          "writable": true,
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "vault",
          "docs": [
            "The token account for the asset which the lp vault holds"
          ],
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "collateral",
          "docs": [
            "The mint of the token that will be received for staking the vault asset"
          ],
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "strategyRequest",
          "docs": [
            "Temporary 'cache' account to store the state of the strategy request between instructions"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121,
                  95,
                  114,
                  101,
                  113,
                  117,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "strategy"
              }
            ]
          }
        },
        {
          "name": "strategy",
          "docs": [
            "The 'strategy'"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "lpVault"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "docs": [
            "The lp vault's token account",
            "Holds the 'collateral' token"
          ],
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "sysvarInfo",
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "strategyWithdrawCleanup",
      "discriminator": [
        144,
        84,
        89,
        51,
        8,
        192,
        83,
        73
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "lpVault",
          "writable": true,
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "collateral",
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "strategy",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "lpVault"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "writable": true,
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "strategyRequest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121,
                  95,
                  114,
                  101,
                  113,
                  117,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "strategy"
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "wasabiProgram",
          "address": "spicyTHtbmarmUxwFSHYpA8G4uP2nRNq38RReMpoZ9c"
        }
      ],
      "args": []
    },
    {
      "name": "strategyWithdrawSetup",
      "discriminator": [
        85,
        147,
        77,
        105,
        240,
        187,
        240,
        114
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "lpVault",
          "writable": true,
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "collateral",
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "strategy",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "lpVault"
              },
              {
                "kind": "account",
                "path": "collateral"
              }
            ]
          }
        },
        {
          "name": "strategyRequest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121,
                  95,
                  114,
                  101,
                  113,
                  117,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "strategy"
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "writable": true,
          "relations": [
            "strategy"
          ]
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "sysvarInfo",
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "takeProfit",
      "discriminator": [
        66,
        6,
        244,
        211,
        190,
        249,
        180,
        185
      ],
      "accounts": [
        {
          "name": "closePosition",
          "accounts": [
            {
              "name": "owner",
              "writable": true,
              "relations": [
                "ownerPayoutAccount"
              ]
            },
            {
              "name": "ownerPayoutAccount",
              "writable": true
            },
            {
              "name": "lpVault",
              "writable": true,
              "relations": [
                "position"
              ]
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "pool"
            },
            {
              "name": "currencyVault",
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "collateralVault",
              "writable": true,
              "relations": [
                "pool",
                "position"
              ]
            },
            {
              "name": "currency"
            },
            {
              "name": "collateral"
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "feeWallet",
              "writable": true
            },
            {
              "name": "liquidationWallet",
              "writable": true
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "currencyTokenProgram"
            },
            {
              "name": "collateralTokenProgram"
            },
            {
              "name": "systemProgram",
              "address": "11111111111111111111111111111111"
            }
          ]
        },
        {
          "name": "takeProfitOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  107,
                  101,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  116,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "close_position.position",
                "account": "closePositionInternal"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "interest",
          "type": "u64"
        },
        {
          "name": "executionFee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "route",
          "type": {
            "defined": {
              "name": "route"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "takeProfitCleanup",
      "discriminator": [
        121,
        193,
        204,
        83,
        129,
        84,
        220,
        193
      ],
      "accounts": [
        {
          "name": "closePositionCleanup",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The wallet that owns the assets"
              ],
              "writable": true,
              "relations": [
                "ownerPayoutAccount"
              ]
            },
            {
              "name": "ownerPayoutAccount",
              "writable": true
            },
            {
              "name": "pool",
              "docs": [
                "The Long or Short Pool that owns the Position"
              ]
            },
            {
              "name": "collateralVault",
              "docs": [
                "The collateral account that is the source of the swap"
              ],
              "relations": [
                "pool",
                "position"
              ]
            },
            {
              "name": "currencyVault",
              "docs": [
                "The token account that is the destination of the swap"
              ],
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "currency"
            },
            {
              "name": "collateral"
            },
            {
              "name": "closePositionRequest",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      99,
                      108,
                      111,
                      115,
                      101,
                      95,
                      112,
                      111,
                      115
                    ]
                  },
                  {
                    "kind": "account",
                    "path": "owner"
                  }
                ]
              }
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true
            },
            {
              "name": "lpVault",
              "writable": true,
              "relations": [
                "position"
              ]
            },
            {
              "name": "vault",
              "docs": [
                "The LP Vault's token account."
              ],
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "feeWallet",
              "writable": true
            },
            {
              "name": "liquidationWallet",
              "writable": true
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "currencyTokenProgram"
            },
            {
              "name": "collateralTokenProgram"
            }
          ]
        },
        {
          "name": "takeProfitOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  107,
                  101,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  116,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "close_position_cleanup.position",
                "account": "closePositionCleanup"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "takeProfitSetup",
      "discriminator": [
        5,
        48,
        42,
        167,
        181,
        20,
        139,
        168
      ],
      "accounts": [
        {
          "name": "closePositionSetup",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The wallet that owns the assets"
              ],
              "writable": true
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "pool",
              "docs": [
                "The pool that owns the Position"
              ]
            },
            {
              "name": "collateralVault",
              "docs": [
                "The collateral account that is the source of the swap"
              ],
              "writable": true,
              "relations": [
                "position",
                "pool"
              ]
            },
            {
              "name": "currencyVault",
              "docs": [
                "The token account that is the destination of the swap"
              ],
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "collateral"
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "closePositionRequest",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      99,
                      108,
                      111,
                      115,
                      101,
                      95,
                      112,
                      111,
                      115
                    ]
                  },
                  {
                    "kind": "account",
                    "path": "owner"
                  }
                ]
              }
            },
            {
              "name": "tokenProgram"
            },
            {
              "name": "systemProgram",
              "address": "11111111111111111111111111111111"
            },
            {
              "name": "sysvarInfo",
              "address": "Sysvar1nstructions1111111111111111111111111"
            }
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "interest",
          "type": "u64"
        },
        {
          "name": "executionFee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "updateLongPosition",
      "discriminator": [
        247,
        217,
        253,
        122,
        241,
        234,
        108,
        246
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "ownerCurrencyAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "currency"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lpVault"
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "pool"
        },
        {
          "name": "currencyVault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "collateralVault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "currency"
        },
        {
          "name": "collateral"
        },
        {
          "name": "position",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "feeWallet",
          "writable": true
        },
        {
          "name": "debtController",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  98,
                  116,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  108,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "downPayment",
          "type": "u64"
        },
        {
          "name": "principal",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "route",
          "type": {
            "defined": {
              "name": "route"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "updateLongWithShares",
      "discriminator": [
        119,
        203,
        242,
        206,
        218,
        233,
        226,
        90
      ],
      "accounts": [
        {
          "name": "withdraw",
          "accounts": [
            {
              "name": "owner",
              "docs": [
                "The key of the user that owns the assets"
              ],
              "signer": true
            },
            {
              "name": "ownerAssetAccount",
              "docs": [
                "The Owner's token account that holds the assets"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "assetTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "assetMint"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "ownerSharesAccount",
              "docs": [
                "The Owner's token account that stores share tokens"
              ],
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "sharesTokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "sharesMint"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "lpVault",
              "writable": true
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "assetMint"
            },
            {
              "name": "sharesMint",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "assetTokenProgram"
            },
            {
              "name": "sharesTokenProgram",
              "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
            },
            {
              "name": "eventAuthority",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      95,
                      95,
                      101,
                      118,
                      101,
                      110,
                      116,
                      95,
                      97,
                      117,
                      116,
                      104,
                      111,
                      114,
                      105,
                      116,
                      121
                    ]
                  }
                ]
              }
            },
            {
              "name": "program"
            }
          ]
        },
        {
          "name": "editPosition",
          "accounts": [
            {
              "name": "owner",
              "writable": true,
              "signer": true
            },
            {
              "name": "ownerCurrencyAccount",
              "writable": true,
              "pda": {
                "seeds": [
                  {
                    "kind": "account",
                    "path": "owner"
                  },
                  {
                    "kind": "account",
                    "path": "tokenProgram"
                  },
                  {
                    "kind": "account",
                    "path": "currency"
                  }
                ],
                "program": {
                  "kind": "const",
                  "value": [
                    140,
                    151,
                    37,
                    143,
                    78,
                    36,
                    137,
                    241,
                    187,
                    61,
                    16,
                    41,
                    20,
                    142,
                    13,
                    131,
                    11,
                    90,
                    19,
                    153,
                    218,
                    255,
                    16,
                    132,
                    4,
                    142,
                    123,
                    216,
                    219,
                    233,
                    248,
                    89
                  ]
                }
              }
            },
            {
              "name": "lpVault"
            },
            {
              "name": "vault",
              "writable": true,
              "relations": [
                "lpVault"
              ]
            },
            {
              "name": "pool"
            },
            {
              "name": "currencyVault",
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "collateralVault",
              "writable": true,
              "relations": [
                "pool"
              ]
            },
            {
              "name": "currency"
            },
            {
              "name": "collateral"
            },
            {
              "name": "position",
              "writable": true
            },
            {
              "name": "authority",
              "writable": true,
              "signer": true,
              "relations": [
                "permission"
              ]
            },
            {
              "name": "permission"
            },
            {
              "name": "feeWallet",
              "writable": true
            },
            {
              "name": "debtController",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      100,
                      101,
                      98,
                      116,
                      95,
                      99,
                      111,
                      110,
                      116,
                      114,
                      111,
                      108,
                      108,
                      101,
                      114
                    ]
                  }
                ]
              }
            },
            {
              "name": "globalSettings",
              "pda": {
                "seeds": [
                  {
                    "kind": "const",
                    "value": [
                      103,
                      108,
                      111,
                      98,
                      97,
                      108,
                      95,
                      115,
                      101,
                      116,
                      116,
                      105,
                      110,
                      103,
                      115
                    ]
                  }
                ]
              }
            },
            {
              "name": "tokenProgram"
            },
            {
              "name": "systemProgram",
              "address": "11111111111111111111111111111111"
            }
          ]
        }
      ],
      "args": [
        {
          "name": "minTargetAmount",
          "type": "u64"
        },
        {
          "name": "downPayment",
          "type": "u64"
        },
        {
          "name": "principal",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "route",
          "type": {
            "defined": {
              "name": "route"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "updateLpVaultMaxBorrow",
      "discriminator": [
        186,
        43,
        42,
        134,
        64,
        195,
        117,
        91
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "docs": [
            "The key that has permission to init the vault"
          ],
          "signer": true,
          "relations": [
            "permission"
          ]
        },
        {
          "name": "permission"
        },
        {
          "name": "lpVault",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "maxBorrow",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The key of the user that owns the assets"
          ],
          "signer": true
        },
        {
          "name": "ownerAssetAccount",
          "docs": [
            "The Owner's token account that holds the assets"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "assetTokenProgram"
              },
              {
                "kind": "account",
                "path": "assetMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "ownerSharesAccount",
          "docs": [
            "The Owner's token account that stores share tokens"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "sharesTokenProgram"
              },
              {
                "kind": "account",
                "path": "sharesMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "lpVault",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "assetMint"
        },
        {
          "name": "sharesMint",
          "writable": true,
          "relations": [
            "lpVault"
          ]
        },
        {
          "name": "globalSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "assetTokenProgram"
        },
        {
          "name": "sharesTokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "basePool",
      "discriminator": [
        220,
        192,
        66,
        74,
        196,
        95,
        91,
        32
      ]
    },
    {
      "name": "closePositionRequest",
      "discriminator": [
        45,
        32,
        167,
        75,
        185,
        157,
        104,
        104
      ]
    },
    {
      "name": "debtController",
      "discriminator": [
        15,
        0,
        65,
        34,
        85,
        181,
        112,
        96
      ]
    },
    {
      "name": "globalSettings",
      "discriminator": [
        109,
        67,
        50,
        55,
        2,
        20,
        148,
        62
      ]
    },
    {
      "name": "lpVault",
      "discriminator": [
        189,
        45,
        167,
        23,
        91,
        118,
        105,
        190
      ]
    },
    {
      "name": "openPositionRequest",
      "discriminator": [
        237,
        210,
        161,
        104,
        136,
        87,
        8,
        32
      ]
    },
    {
      "name": "permission",
      "discriminator": [
        224,
        83,
        28,
        79,
        10,
        253,
        161,
        28
      ]
    },
    {
      "name": "position",
      "discriminator": [
        170,
        188,
        143,
        228,
        122,
        64,
        247,
        208
      ]
    },
    {
      "name": "stopLossOrder",
      "discriminator": [
        43,
        203,
        37,
        200,
        211,
        11,
        96,
        189
      ]
    },
    {
      "name": "strategy",
      "discriminator": [
        174,
        110,
        39,
        119,
        82,
        106,
        169,
        102
      ]
    },
    {
      "name": "strategyRequest",
      "discriminator": [
        64,
        193,
        58,
        72,
        171,
        75,
        231,
        28
      ]
    },
    {
      "name": "takeProfitOrder",
      "discriminator": [
        57,
        155,
        59,
        40,
        224,
        162,
        243,
        69
      ]
    }
  ],
  "events": [
    {
      "name": "collateralAdded",
      "discriminator": [
        172,
        68,
        58,
        249,
        157,
        64,
        74,
        141
      ]
    },
    {
      "name": "collateralAddedToPosition",
      "discriminator": [
        52,
        209,
        134,
        206,
        155,
        109,
        155,
        243
      ]
    },
    {
      "name": "deposit",
      "discriminator": [
        62,
        205,
        242,
        175,
        244,
        169,
        136,
        52
      ]
    },
    {
      "name": "exitOrder",
      "discriminator": [
        28,
        67,
        208,
        198,
        99,
        16,
        72,
        136
      ]
    },
    {
      "name": "exitOrderCancelled",
      "discriminator": [
        212,
        82,
        232,
        143,
        229,
        48,
        61,
        76
      ]
    },
    {
      "name": "nativeYieldClaimed",
      "discriminator": [
        199,
        93,
        56,
        208,
        129,
        21,
        55,
        222
      ]
    },
    {
      "name": "newVault",
      "discriminator": [
        218,
        228,
        16,
        185,
        87,
        12,
        239,
        14
      ]
    },
    {
      "name": "positionClosed",
      "discriminator": [
        157,
        163,
        227,
        228,
        13,
        97,
        138,
        121
      ]
    },
    {
      "name": "positionClosedWithOrder",
      "discriminator": [
        217,
        247,
        190,
        46,
        223,
        135,
        237,
        158
      ]
    },
    {
      "name": "positionDecreased",
      "discriminator": [
        251,
        151,
        37,
        204,
        127,
        87,
        115,
        232
      ]
    },
    {
      "name": "positionDecreasedWithOrder",
      "discriminator": [
        174,
        196,
        21,
        217,
        36,
        62,
        214,
        106
      ]
    },
    {
      "name": "positionIncreased",
      "discriminator": [
        73,
        58,
        247,
        181,
        100,
        237,
        249,
        81
      ]
    },
    {
      "name": "positionLiquidated",
      "discriminator": [
        40,
        107,
        90,
        214,
        96,
        30,
        61,
        128
      ]
    },
    {
      "name": "positionOpened",
      "discriminator": [
        237,
        175,
        243,
        230,
        147,
        117,
        101,
        121
      ]
    },
    {
      "name": "strategyClaim",
      "discriminator": [
        138,
        31,
        183,
        119,
        218,
        136,
        43,
        154
      ]
    },
    {
      "name": "strategyDeposit",
      "discriminator": [
        205,
        53,
        91,
        239,
        34,
        136,
        73,
        47
      ]
    },
    {
      "name": "strategyWithdraw",
      "discriminator": [
        120,
        76,
        208,
        95,
        221,
        210,
        229,
        189
      ]
    },
    {
      "name": "withdraw",
      "discriminator": [
        192,
        241,
        201,
        217,
        70,
        150,
        90,
        247
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidPermissions",
      "msg": "Unpermitted action by authority"
    },
    {
      "code": 6001,
      "name": "unpermittedIx",
      "msg": "Unpermitted instructions in tx"
    },
    {
      "code": 6002,
      "name": "missingCleanup",
      "msg": "Missing cleanup ix"
    },
    {
      "code": 6003,
      "name": "positionReqExpired",
      "msg": "expired"
    },
    {
      "code": 6004,
      "name": "minTokensNotMet",
      "msg": "Minimum tokens not met"
    },
    {
      "code": 6005,
      "name": "swapAmountExceeded",
      "msg": "Swap amount limit was exceeded"
    },
    {
      "code": 6006,
      "name": "invalidPool",
      "msg": "Invalid pool"
    },
    {
      "code": 6007,
      "name": "invalidPosition",
      "msg": "Invalid position"
    },
    {
      "code": 6008,
      "name": "invalidSwapCosigner",
      "msg": "Invalid swap cosigner"
    },
    {
      "code": 6009,
      "name": "maxSwapExceeded",
      "msg": "Maximum tokens swapped exceeded"
    },
    {
      "code": 6010,
      "name": "incorrectOwner",
      "msg": "Owner doesnt match"
    },
    {
      "code": 6011,
      "name": "badDebt",
      "msg": "Cannot close bad debt"
    },
    {
      "code": 6012,
      "name": "incorrectFeeWallet",
      "msg": "Wrong fee wallet"
    },
    {
      "code": 6013,
      "name": "invalidValue",
      "msg": "Invalid value"
    },
    {
      "code": 6014,
      "name": "insufficientAvailablePrincipal",
      "msg": "Insufficient available principal"
    },
    {
      "code": 6015,
      "name": "principalTooHigh",
      "msg": "Principal too high"
    },
    {
      "code": 6016,
      "name": "valueDeviatedTooMuch",
      "msg": "Value deviated too much"
    },
    {
      "code": 6017,
      "name": "priceTargetNotReached",
      "msg": "Price target not reached"
    },
    {
      "code": 6018,
      "name": "maxBorrowExceeded",
      "msg": "Max borrow exceeded"
    },
    {
      "code": 6019,
      "name": "maxRepayExceeded",
      "msg": "Max repay exceeded"
    },
    {
      "code": 6020,
      "name": "tradingDisabled",
      "msg": "Trading disabled"
    },
    {
      "code": 6021,
      "name": "lPingDisabled",
      "msg": "LPing disabled"
    },
    {
      "code": 6022,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6023,
      "name": "arithmeticUnderflow",
      "msg": "Arithmetic underflow"
    },
    {
      "code": 6024,
      "name": "integerOverflow",
      "msg": "Failed to cast integer to original type"
    },
    {
      "code": 6025,
      "name": "zeroDivision",
      "msg": "Division by zero"
    },
    {
      "code": 6026,
      "name": "liquidationThresholdNotReached",
      "msg": "Liquidation threshold not reached"
    },
    {
      "code": 6027,
      "name": "invalidAccountOwner",
      "msg": "Payout token account is not owned by the correct wallet"
    },
    {
      "code": 6028,
      "name": "incorrectTokenProgram",
      "msg": "Payout token account is not owned by the correct token program"
    },
    {
      "code": 6029,
      "name": "mintMismatch",
      "msg": "The payout token account's associated mint does not match"
    },
    {
      "code": 6030,
      "name": "invalidPubkey",
      "msg": "Invalid pubkey"
    },
    {
      "code": 6031,
      "name": "zeroAmount",
      "msg": "Amount cannot be 0"
    },
    {
      "code": 6032,
      "name": "invalidSwap",
      "msg": "Invalid swap"
    },
    {
      "code": 6033,
      "name": "balanceUnchanged",
      "msg": "Vault balance unchanged"
    },
    {
      "code": 6034,
      "name": "sourceOverflow",
      "msg": "Source overflow"
    },
    {
      "code": 6035,
      "name": "destionationOverflow",
      "msg": "Destionation overflow"
    },
    {
      "code": 6036,
      "name": "vaultNotEmpty",
      "msg": "Strategy cannot be closed if the collateral vault is not empty"
    },
    {
      "code": 6037,
      "name": "liquidationWalletNotSet",
      "msg": "Liquidation wallet was not provided"
    },
    {
      "code": 6038,
      "name": "tooMuchCollateralSpent",
      "msg": "Too much collateral spent"
    },
    {
      "code": 6039,
      "name": "invalidOrder",
      "msg": "Invalid order"
    },
    {
      "code": 6040,
      "name": "insufficientPrincipalRepaid",
      "msg": "Insufficient principal repaid"
    },
    {
      "code": 6041,
      "name": "maxInterestExceeded",
      "msg": "Interest payment exceeds maximum interest"
    }
  ],
  "types": [
    {
      "name": "authorityStatus",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "inactive"
          },
          {
            "name": "active"
          }
        ]
      }
    },
    {
      "name": "basePool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "collateral",
            "docs": [
              "The mint address for the collateral type this pool supports"
            ],
            "type": "pubkey"
          },
          {
            "name": "collateralVault",
            "docs": [
              "The token account address for holding the collateral (target currency) of this long pool"
            ],
            "type": "pubkey"
          },
          {
            "name": "currency",
            "docs": [
              "The mint address for the currency type this pool supports"
            ],
            "type": "pubkey"
          },
          {
            "name": "currencyVault",
            "docs": [
              "The token account address for holding the currency, which will be swapped."
            ],
            "type": "pubkey"
          },
          {
            "name": "isLongPool",
            "docs": [
              "Flag to determine if it's a long or short pool"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "The bump seed for this PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "closePositionRequest",
      "docs": [
        "An account that is used to cache data between the open position setup and cleanup instructions."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "swapCache",
            "type": {
              "defined": {
                "name": "swapCache"
              }
            }
          },
          {
            "name": "interest",
            "type": "u64"
          },
          {
            "name": "minTargetAmount",
            "type": "u64"
          },
          {
            "name": "maxAmountIn",
            "type": "u64"
          },
          {
            "name": "poolKey",
            "type": "pubkey"
          },
          {
            "name": "position",
            "type": "pubkey"
          },
          {
            "name": "executionFee",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "feesToBePaid",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "collateralAdded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "pubkey"
          },
          {
            "name": "trader",
            "type": "pubkey"
          },
          {
            "name": "downPaymentAdded",
            "type": "u64"
          },
          {
            "name": "collateralAdded",
            "type": "u64"
          },
          {
            "name": "principalReduced",
            "type": "u64"
          },
          {
            "name": "interestPaid",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "collateralAddedToPosition",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "pubkey"
          },
          {
            "name": "trader",
            "type": "pubkey"
          },
          {
            "name": "downPaymentAdded",
            "type": "u64"
          },
          {
            "name": "collateralAdded",
            "type": "u64"
          },
          {
            "name": "feesAdded",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "debtController",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maxApy",
            "type": "u64"
          },
          {
            "name": "maxLeverage",
            "type": "u64"
          },
          {
            "name": "liquidationFee",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "deposit",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "sender",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "assets",
            "type": "u64"
          },
          {
            "name": "shares",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "exitOrder",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderType",
            "type": "u8"
          },
          {
            "name": "positionId",
            "type": "pubkey"
          },
          {
            "name": "makerAmount",
            "type": "u64"
          },
          {
            "name": "takerAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "exitOrderCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderType",
            "type": "u8"
          },
          {
            "name": "positionId",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "globalSettings",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "pubkey"
          },
          {
            "name": "feeWallet",
            "type": "pubkey"
          },
          {
            "name": "liquidationWallet",
            "type": "pubkey"
          },
          {
            "name": "statuses",
            "docs": [
              "Bit mapping of enabled features. Status allow disabling trading, lping, etc."
            ],
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "hop",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "programId",
            "type": "pubkey"
          },
          {
            "name": "dataStartIdx",
            "type": "u8"
          },
          {
            "name": "dataSize",
            "type": "u8"
          },
          {
            "name": "accountStartIdx",
            "type": "u8"
          },
          {
            "name": "numAccounts",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "initGlobalSettingsArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "pubkey"
          },
          {
            "name": "feeWallet",
            "type": "pubkey"
          },
          {
            "name": "liquidationWallet",
            "type": "pubkey"
          },
          {
            "name": "statuses",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "initLpVaultArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "initOrUpdatePermissionArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "authorityStatus"
              }
            }
          },
          {
            "name": "canInitVaults",
            "type": "bool"
          },
          {
            "name": "canLiquidate",
            "type": "bool"
          },
          {
            "name": "canCosignSwaps",
            "type": "bool"
          },
          {
            "name": "canInitPools",
            "type": "bool"
          },
          {
            "name": "canBorrowFromVaults",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "lpVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "docs": [
              "Bump seed for the LpVault's PDA"
            ],
            "type": "u8"
          },
          {
            "name": "asset",
            "docs": [
              "The SPL Mint address of the token that sits in this vault"
            ],
            "type": "pubkey"
          },
          {
            "name": "vault",
            "docs": [
              "The SPL Token account that stores the unborrowed tokens"
            ],
            "type": "pubkey"
          },
          {
            "name": "sharesMint",
            "docs": [
              "The SPL Mint address that represents shares in the vault"
            ],
            "type": "pubkey"
          },
          {
            "name": "totalAssets",
            "docs": [
              "Count of the total assets owned by the vault, including tokens that are currently borrowed"
            ],
            "type": "u64"
          },
          {
            "name": "maxBorrow",
            "docs": [
              "Maximum amount that can be borrowed by admin"
            ],
            "type": "u64"
          },
          {
            "name": "totalBorrowed",
            "docs": [
              "Total amount currently borrowed from the vault that is to be paid back by the admin"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "nativeYieldClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "source",
            "type": "pubkey"
          },
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "token",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "newVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "asset",
            "type": "pubkey"
          },
          {
            "name": "vault",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "openPositionRequest",
      "docs": [
        "An account that is used to cache data between the open position setup and cleanup instructions."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "swapCache",
            "type": {
              "defined": {
                "name": "swapCache"
              }
            }
          },
          {
            "name": "minTargetAmount",
            "type": "u64"
          },
          {
            "name": "maxAmountIn",
            "type": "u64"
          },
          {
            "name": "poolKey",
            "type": "pubkey"
          },
          {
            "name": "position",
            "type": "pubkey"
          },
          {
            "name": "principal",
            "type": "u64"
          },
          {
            "name": "downPayment",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "permission",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The key that is given these permissions"
            ],
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "authorityStatus"
              }
            }
          },
          {
            "name": "isSuperAuthority",
            "type": "bool"
          },
          {
            "name": "permissionsMap",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "position",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "trader",
            "docs": [
              "Wallet that opened the position"
            ],
            "type": "pubkey"
          },
          {
            "name": "currency",
            "docs": [
              "The address of the currency to be paid for the position."
            ],
            "type": "pubkey"
          },
          {
            "name": "collateral",
            "docs": [
              "The address of the currency to be received for the position."
            ],
            "type": "pubkey"
          },
          {
            "name": "lastFundingTimestamp",
            "docs": [
              "The timestamp of the last funding payment."
            ],
            "type": "i64"
          },
          {
            "name": "downPayment",
            "docs": [
              "The initial down payment amount required to open the position (is in `currency` for long, `collateralCurrency` for short positions)",
              "i.e. It is always in the quote currency"
            ],
            "type": "u64"
          },
          {
            "name": "principal",
            "docs": [
              "The total principal amount to be borrowed for the position (is in `currency`)"
            ],
            "type": "u64"
          },
          {
            "name": "collateralAmount",
            "docs": [
              "The total collateral amount to be received for the position (is in `collateralCurrency`)"
            ],
            "type": "u64"
          },
          {
            "name": "feesToBePaid",
            "docs": [
              "The total fees to be paid for the position (is in `currency`)"
            ],
            "type": "u64"
          },
          {
            "name": "collateralVault",
            "docs": [
              "Link to the token account that is holding the collateral"
            ],
            "type": "pubkey"
          },
          {
            "name": "lpVault",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "positionClosed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "side",
            "type": "string"
          },
          {
            "name": "id",
            "type": "pubkey"
          },
          {
            "name": "trader",
            "type": "pubkey"
          },
          {
            "name": "payout",
            "type": "u64"
          },
          {
            "name": "principalRepaid",
            "type": "u64"
          },
          {
            "name": "interestPaid",
            "type": "u64"
          },
          {
            "name": "feeAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "positionClosedWithOrder",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "side",
            "type": "string"
          },
          {
            "name": "id",
            "type": "pubkey"
          },
          {
            "name": "trader",
            "type": "pubkey"
          },
          {
            "name": "orderType",
            "type": "u8"
          },
          {
            "name": "payout",
            "type": "u64"
          },
          {
            "name": "principalRepaid",
            "type": "u64"
          },
          {
            "name": "interestPaid",
            "type": "u64"
          },
          {
            "name": "feeAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "positionDecreased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "pubkey"
          },
          {
            "name": "trader",
            "type": "pubkey"
          },
          {
            "name": "payout",
            "type": "u64"
          },
          {
            "name": "principalRepaid",
            "type": "u64"
          },
          {
            "name": "interestPaid",
            "type": "u64"
          },
          {
            "name": "closeFee",
            "type": "u64"
          },
          {
            "name": "pastFees",
            "type": "u64"
          },
          {
            "name": "collateralReduced",
            "type": "u64"
          },
          {
            "name": "downPaymentReduced",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "positionDecreasedWithOrder",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "pubkey"
          },
          {
            "name": "trader",
            "type": "pubkey"
          },
          {
            "name": "orderType",
            "type": "u8"
          },
          {
            "name": "payout",
            "type": "u64"
          },
          {
            "name": "principalRepaid",
            "type": "u64"
          },
          {
            "name": "interestPaid",
            "type": "u64"
          },
          {
            "name": "closeFee",
            "type": "u64"
          },
          {
            "name": "pastFees",
            "type": "u64"
          },
          {
            "name": "collateralReduced",
            "type": "u64"
          },
          {
            "name": "downPaymentReduced",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "positionIncreased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "pubkey"
          },
          {
            "name": "trader",
            "type": "pubkey"
          },
          {
            "name": "downPaymentAdded",
            "type": "u64"
          },
          {
            "name": "principalAdded",
            "type": "u64"
          },
          {
            "name": "collateralAdded",
            "type": "u64"
          },
          {
            "name": "feesAdded",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "positionLiquidated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "side",
            "type": "string"
          },
          {
            "name": "id",
            "type": "pubkey"
          },
          {
            "name": "trader",
            "type": "pubkey"
          },
          {
            "name": "payout",
            "type": "u64"
          },
          {
            "name": "principalRepaid",
            "type": "u64"
          },
          {
            "name": "interestPaid",
            "type": "u64"
          },
          {
            "name": "feeAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "positionOpened",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "side",
            "type": "string"
          },
          {
            "name": "positionId",
            "type": "pubkey"
          },
          {
            "name": "trader",
            "type": "pubkey"
          },
          {
            "name": "currency",
            "type": "pubkey"
          },
          {
            "name": "collateralCurrency",
            "type": "pubkey"
          },
          {
            "name": "downPayment",
            "type": "u64"
          },
          {
            "name": "principal",
            "type": "u64"
          },
          {
            "name": "collateralAmount",
            "type": "u64"
          },
          {
            "name": "feesToBePaid",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "route",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "hops",
            "type": {
              "vec": {
                "defined": {
                  "name": "hop"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "stopLossOrder",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "position",
            "docs": [
              "Position this Stop Loss Order corresponds to"
            ],
            "type": "pubkey"
          },
          {
            "name": "makerAmount",
            "docs": [
              "The amount that will be sold from the position (is in `position.collateral_currency`)"
            ],
            "type": "u64"
          },
          {
            "name": "takerAmount",
            "docs": [
              "The amount that will be bought to close the position (is in `position.currency`)"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "strategy",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "lpVault",
            "type": "pubkey"
          },
          {
            "name": "currency",
            "type": "pubkey"
          },
          {
            "name": "collateral",
            "type": "pubkey"
          },
          {
            "name": "collateralVault",
            "type": "pubkey"
          },
          {
            "name": "collateralAmount",
            "type": "u64"
          },
          {
            "name": "totalBorrowedAmount",
            "type": "u64"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "strategyCache",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "srcBalBefore",
            "type": "u64"
          },
          {
            "name": "dstBalBefore",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "strategyClaim",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "strategy",
            "type": "pubkey"
          },
          {
            "name": "vaultAddress",
            "type": "pubkey"
          },
          {
            "name": "collateral",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "strategyDeposit",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "strategy",
            "type": "pubkey"
          },
          {
            "name": "vaultAddress",
            "type": "pubkey"
          },
          {
            "name": "collateral",
            "type": "pubkey"
          },
          {
            "name": "amountDeposited",
            "type": "u64"
          },
          {
            "name": "collateralReceived",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "strategyRequest",
      "docs": [
        "An account that is used to cache data between the open position setup and cleanup instructions."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "strategyCache",
            "type": {
              "defined": {
                "name": "strategyCache"
              }
            }
          },
          {
            "name": "minTargetAmount",
            "type": "u64"
          },
          {
            "name": "maxAmountIn",
            "type": "u64"
          },
          {
            "name": "lpVaultKey",
            "type": "pubkey"
          },
          {
            "name": "strategy",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "strategyWithdraw",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "strategy",
            "type": "pubkey"
          },
          {
            "name": "vaultAddress",
            "type": "pubkey"
          },
          {
            "name": "collateral",
            "type": "pubkey"
          },
          {
            "name": "amountWithdraw",
            "type": "u64"
          },
          {
            "name": "collateralSold",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "swapCache",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "makerBalBefore",
            "type": "u64"
          },
          {
            "name": "takerBalBefore",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "takeProfitOrder",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "position",
            "docs": [
              "Position this Take Profit Order corresponds to"
            ],
            "type": "pubkey"
          },
          {
            "name": "makerAmount",
            "docs": [
              "The amount that will be sold from the position (is in `position.collateral_currency`)"
            ],
            "type": "u64"
          },
          {
            "name": "takerAmount",
            "docs": [
              "The amount that will be bought to close the position (is in `position.currency`)"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "withdraw",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "sender",
            "type": "pubkey"
          },
          {
            "name": "receiver",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "assets",
            "type": "u64"
          },
          {
            "name": "shares",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "seed",
      "type": "string",
      "value": "\"anchor\""
    }
  ]
};
