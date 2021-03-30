# PartChain Smart Contract

> **Note:** This repository is still under active development! Breaking changes are possible, and we are working on improving code quality.

This repository is representing PartChain project Smart Contract for HLF.

> Please note that for successful instantiation of this Smart Contract in your network, `package.json` file must contain script `start` with following command `fabric-chaincode-node start`.

## Build-in scripts

**Start app in development mode**

```bash
$ yarn|npm run serve
```

**Build app for production**

```bash
$ yarn|npm run build
```

**Build app for development**

```bash
$ yarn|npm run build:dev
```

**Build app for development and turn on Webpack watcher**

```bash
$ yarn|npm run watch
```

**Execute unit test via JEST**

```bash
$ yarn|npm run tests
```

**Generate API reference documentation**

```bash
$ yarn|npm run docs
```

## Private data collections configuration

Currently we use the implicit private data collection to store the private data. we also use store the action, timestamp, componentFullHash,componentSharedHash, serialNumberCustomerHash, transactionID and mspID in the public ledger.

## Build process

This application source code is written in Typescript and its using [Webpack](https://webpack.js.org/) for conversion to ES6 to be in compliance with HLF requirements. Output ECMA Script version could be changed in `./tsconfig.json` file. For more information about possible Typescript configuration options please follow this [link](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).

## Chaincode Functions

**create Asset Implicit Private data**

During asset creation every org stores their asset in their own private data collection, the MSPID of the organisation is automatically added to the asset data model from the chaincode. We also store the hash of the asset along with the MSPID in the public ledger. So, this gives the option for any participant in the PartChain network to verify the asset information is same.

```
export ORG1_PEER1_CA=/etc/hyperledger/artifacts/crypto-config/peerOrganizations/org1.svc.cluster.local/peers/peer1.org1.svc.cluster.local/tls/ca.crt

export ORG2_PEER1_CA=/etc/hyperledger/artifacts/crypto-config/peerOrganizations/org2.svc.cluster.local/peers/peer1.org2.svc.cluster.local/tls/ca.crt

export ORG3_PEER1_CA=/etc/hyperledger/artifacts/crypto-config/peerOrganizations/org3.svc.cluster.local/peers/peer1.org3.svc.cluster.local/tls/ca.crt


export ASSET_PROPERTIES=$(echo -n  "{\"manufacturer\":\"Org2\",\"productionCountryCodeManufacturer\":\"DE\",\"partNameManufacturer\":\"Org2 LG\",\"partNumberManufacturer\":\"F923\",\"partNumberCustomer\":\"OK\",\"serialNumberManufacturer\":\"TESTOrg2PART0000001\",\"serialNumberCustomer\":\"TESTOrg2PART0000001\",\"qualityStatus\":\"OK\",\"manufacturerPlant\":\"DE\",\"manufacturerLine\":\"LINE-2\",\"serialNumberType\":\"SINGLE\",\"customFields\":\"OK\",\"qualityDocuments\":[{\"documentHash\":\"0xwefddff23dssddse3\",\"documentUri\":\"https://s3.amazon.org2.com\"},{\"documentHash\":\"0xwefddff23dssewese3\",\"documentUri\":\"https://s3.amazon.org1.com\"}],\"componentsSerialNumbers\":[\"TESTorg3PART0000001\"],\"status\":\"PRODUCED\",\"productionDateGmt\":\"2019-08-29T15:37:33\"}" | base64 | tr -d \\n)

peer chaincode invoke -o orderer2.ord.int.partchain.dev:7050 --tls true --cafile /etc/hyperledger/artifacts/crypto-config/ordererOrganizations/ord.int.partchain.dev/msp/tlscacerts/tlsca.ord.int.partchain.dev-cert.pem -C partchain-channel -n partchaincc --peerAddresses peer1.org2.int.partchain.dev:7051 --tlsRootCertFiles $ORG2_PEER1_CA  --peerAddresses peer2.org2.int.partchain.dev:7051 --tlsRootCertFiles $ORG2_PEER1_CA  -c '{"function":"createAsset","Args":["createAsset"]}' --transient "{\"privatePayload\":\"$ASSET_PROPERTIES\"}"
```

**Request Asset**

If an organisation wants to get the information of assets of another organisation. It is done via the request-exchange process. With this, the requesting org first shares the parent asset information with the member organisation. In the chaincode code, we emit a RequestEvent after successfully sharing the parent information addressed to the TargetOrg. The AEMS of the target org picks up the event and verifies the parent information before writing the data to the offchain DB and if the hash verification is successful, the requested child component details is shared.

```

export ORG1_PEER1_CA=/etc/hyperledger/artifacts/crypto-config/peerOrganizations/org1.svc.cluster.local/peers/peer1.org1.svc.cluster.local/tls/ca.crt

export ORG2_PEER1_CA=/etc/hyperledger/artifacts/crypto-config/peerOrganizations/org2.svc.cluster.local/peers/peer1.org2.svc.cluster.local/tls/ca.crt

export ORG3_PEER1_CA=/etc/hyperledger/artifacts/crypto-config/peerOrganizations/org3.svc.cluster.local/peers/peer1.org3.svc.cluster.local/tls/ca.crt


export ASSET_PROPERTIES=$(echo -n  "\"manufacturerMSPID\":\"Org3\",\"childSerialNumberCustomer\":[{\"serialNumberCustomer\":\"TESTorg3PART0000001\",\"flagged\":false}],\"manufacturer\":\"org1\",\"productionCountryCodeManufacturer\":\"DE\",\"partNameManufacturer\":\"org1 LG\",\"partNumberManufacturer\":\"F923\",\"partNumberCustomer\":\"OK\",\"serialNumberManufacturer\":\"TESTorg1PART0000001\",\"serialNumberCustomer\":\"TESTorg1PART0000001\",\"qualityStatus\":\"OK\",\"IsUnderInvestigation\":false,\"IsOneUpAllDown\":false,\"manufacturerPlant\":\"DE\",\"manufacturerLine\":\"LINE-2\",\"serialNumberType\":\"SINGLE\",\"customFields\":\"OK\",\"qualityDocuments\":[{\"documentHash\":\"0xwefddff23dssddse3\",\"documentUri\":\"https://s3.amazon.org1.com\"},{\"documentHash\":\"0xwefddff23dssewese3\",\"documentUri\":\"https://s3.amazon.org1.com\"}],\"status\":\"PRODUCED\",\"productionDateGmt\":\"2019-08-29T15:37:33\"}" | base64 | tr -d \\n)

peer chaincode invoke -o orderer2.ord.svc.cluster.local:7050 --tls true --cafile /etc/hyperledger/artifacts/crypto-config/ordererOrganizations/ord.svc.cluster.local/msp/tlscacerts/tlsca.ord.svc.cluster.local-cert.pem -C partchain-channel -n partchaincc  --peerAddresses peer1.org3.svc.cluster.local:7051 --tlsRootCertFiles $ORG3_PEER1_CA   -c '{"Function": "requestAsset", "Args":["requestAsset"]}' --transient "{\"privatePayload\":\"$ASSET_PROPERTIES\"}"
```

**Exchange Asset**

After processing the request asset in the AEMS, the responsible org, exchanges the child component details with the requested org and emits ExchangeEvent addressing . This event is addressed to the requested org, the AEMS of the requested org verifies the hash of the shared child asset before writing to the offchain DB.

```
export ORG1_PEER1_CA=/etc/hyperledger/artifacts/crypto-config/peerOrganizations/org1.svc.cluster.local/peers/peer1.org1.svc.cluster.local/tls/ca.crt

export ORG2_PEER1_CA=/etc/hyperledger/artifacts/crypto-config/peerOrganizations/org2.svc.cluster.local/peers/peer1.org2.svc.cluster.local/tls/ca.crt

export ORG3_PEER1_CA=/etc/hyperledger/artifacts/crypto-config/peerOrganizations/org3.svc.cluster.local/peers/peer1.org3.svc.cluster.local/tls/ca.crt


export ASSET_PROPERTIES=$(echo -n   "{\"parentMSP\":\"Org1\",\"assetInfo\":\"{\\\"componentsSerialNumbers\\\": [\\\"TESTorg3PART0000001\\\"],\\\"customFields\\\": \\\"OK\\\",\\\"manufacturer\\\": \\\"Org2\\\",\\\"manufacturerLine\\\": \\\"LINE-2\\\",\\\"manufacturerPlant\\\": \\\"DE\\\",\\\"partNameManufacturer\\\": \\\"Org2 LG\\\",\\\"partNumberCustomer\\\": \\\"OK\\\",\\\"partNumberManufacturer\\\": \\\"AL923\\\",\\\"productionCountryCodeManufacturer\\\": \\\"DE\\\",\\\"productionDateGmt\\\": \\\"2019-08-29T15:37:33\\\",\\\"qualityStatus\\\": \\\"OK\\\",\\\"serialNumberCustomer\\\": \\\"TESTOrg2PART0000002\\\",\\\"serialNumberManufacturer\\\": \\\"TESTALPART0000002\\\",\\\"serialNumberType\\\": \\\"SINGLE\\\",\\\"status\\\": \\\"PRODUCED\\\"}\",\"serialNumberCustomer\":\"TESTOrg2PART0000002\"}" | base64 | tr -d \\n)

peer chaincode invoke -o orderer2.ord.svc.cluster.local:7050 --tls true  --cafile /etc/hyperledger/artifacts/crypto-config/ordererOrganizations/ord.svc.cluster.local/msp/tlscacerts/tlsca.ord.svc.cluster.local-cert.pem  -C partchain-channel -n partchaincc --peerAddresses peer1.org1.svc.cluster.local:7051 --tlsRootCertFiles $ORG1_PEER1_CA  -c '{"function":"exchangeAssetInfo","Args":["exchangeAssetInfo"]}' --transient "{\"privatePayload\":\"$ASSET_PROPERTIES\"}"
```

**getAssetEVENT details**

This function is used to get the details of the asset based in the componentKey

```
peer chaincode query  -C partchain-channel  -n partchaincc  --peerAddresses peer1.org1.svc.cluster.local:7051 --tlsRootCertFiles $ORG1_PEER1_CA  -c '{"function": "getAssetEventDetail", "Args":["getAssetEventDetail","{\"serialNumberCustomer\":\"tQ3pic0AErtdN8Fm1MDyBiOitJxmCwAIncMBaaz6bO4BO5zrLNNqU2XvX1/9MKPX15pcYxFX0hf37ynjfZbjtw==\"}"]}'
```

**get asset details **

This function is used to get the asset details based on the serialNumberCustomer

```
export ORG2_PEER1_CA=/etc/hyperledger/artifacts/crypto-config/peerOrganizations/org2.int.partchain.dev/peers/peer1.org2.int.partchain.dev/tls/ca.crt

peer chaincode query  -C partchain-channel  -n partchaincc  --peerAddresses peer2.org2.int.partchain.dev:7051  --tlsRootCertFiles $ORG2_PEER1_CA  -c '{"function": "getAssetDetail", "Args":["getAssetDetail","{\"serialNumberCustomer\":\"AAMdieNgB1ZbGHPZ3ywPMqjnN6eFBrk+kWNCgFnYQSk0yixL72UPenWVqUMfDadE89y34Iz3UsKRQOHuLgnkF+2Tgq6G0ccZL1dLfoX3Nbawh/s8=\"}"]}'
```

**Enroll ORG**

Org enrolling is necessary to perform asset requests and exchanges in the PartChain.

```
peer chaincode invoke -o orderer2.ord.svc.cluster.local:7050 --tls true  --cafile /etc/hyperledger/artifacts/crypto-config/ordererOrganizations/ord.svc.cluster.local/msp/tlscacerts/tlsca.ord.svc.cluster.local-cert.pem -C partchain-channel -n partchaincc --peerAddresses peer1.org2.svc.cluster.local:7051 --tlsRootCertFiles $ORG2_PEER1_CA -c '{"function": "enrollOrg", "Args":["enrollOrg"]}'
```

**Get org details**

This function gets the information about the org and its relationship with other member orgs in the PartChain.

```
peer chaincode invoke -o orderer2.ord.int.partchain.dev:7050 --tls true  --cafile /etc/hyperledger/artifacts/crypto-config/ordererOrganizations/ord.int.partchain.dev/msp/tlscacerts/tlsca.ord.int.partchain.dev-cert.pem -C partchain-channel -n partchainccp --peerAddresses peer1.org1.int.partchain.dev:7051 --tlsRootCertFiles $ORG1_PEER1_CA  --peerAddresses peer2.org1.int.partchain.dev:7051 --tlsRootCertFiles $ORG1_PEER1_CA -c '{"function": "getOrgDetails", "Args":["getOrgDetails","{\"orgMSP\":\"Org1\"}"]}'
```

**Create Request**

This function is used to create a relationship with another member org in PartChain.

```
peer chaincode invoke -o orderer2.ord.svc.cluster.local:7050 --tls true  --cafile /etc/hyperledger/artifacts/crypto-config/ordererOrganizations/ord.svc.cluster.local/msp/tlscacerts/tlsca.ord.svc.cluster.local-cert.pem -C partchain-channel -n partchaincc --peerAddresses peer1.org1.svc.cluster.local:7051 --tlsRootCertFiles $ORG1_PEER1_CA    -c '{"function": "createRequest", "Args":["createRequest","{\"targetOrg\":\"Org3\",\"comment\":\"Test\"}"]}'
```

**Approve / Reject Request**

This function is used to approve or reject the access request for ACL

```
peer chaincode invoke -o orderer2.ord.svc.cluster.local:7050 --tls true  --cafile /etc/hyperledger/artifacts/crypto-config/ordererOrganizations/ord.svc.cluster.local/msp/tlscacerts/tlsca.ord.svc.cluster.local-cert.pem -C partchain-channel -n partchaincc  --peerAddresses peer1.org3.svc.cluster.local:7051 --tlsRootCertFiles $ORG3_PEER1_CA  -c '{"function": "updateRequest", "Args":["updateRequest","{\"targetOrg\":\"Org1\",\"status\":\"ACTIVE\",\"comment\":\"Test\"}"]}'
```
