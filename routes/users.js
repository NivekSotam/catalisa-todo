var express = require('express');
var router = express.Router();
const Joi = require('joi');
const modelos = require('../modelos.js');
const criptografia = require('../helpers/criptografia')
const jwt =require ('../helpers/jwt')
const autenticacao = require ('../helpers/autenticacao')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

function validacaocadastro (req,res,next) {
  const schema = Joi.object({
    nome: Joi.string().min(1).max(200).required(),
    email: Joi.string().min(10).max(200).required(),
    senha: Joi.string().min(3).max(80).required(),
  });

  const resultado = schema.validate(req.body);
  if (resultado.error) {
    res.status(400).json(resultado.error)
  } else {
    next();
  }


}
router.post('/',validacaocadastro, async function(req, res, next) {
    const usuarioExistente = await modelos.Usuario
    //SELECT * FROM usuarios where email = 'edvaldoszy@gamil.com'
      .where('email','=',req.body.email)
      .fetch();
    if (usuarioExistente){
      res.status(400).json({
        mensagem:'O endereço de email ja está cadastrado'
      });
      return;
    }

  const usuarios = new modelos.Usuario({
    nome:req.body.nome,
    email:req.body.email,
    //senha:req.body.senha,
    senha: criptografia.geraHash(req.body.senha)
  });
  const retorno = await usuarios.save()
   res.status(201).json(retorno);
});

function validacaologin(req,res,next){
  const schema = Joi.object({
    email: Joi.string().min(10).max(200).required(),
    senha: Joi.string().min(3).max(80).required(),
  });

  const resultado = schema.validate(req.body);
  if (resultado.error) {
    res.status(400).json(resultado.error)
  } else {
    next();
  }
}
router.post('/login',validacaologin, async function (req,res){
  const usuarioExistente = await modelos.Usuario
    .where('email','=',req.body.email)
    .fetch();
  if (usuarioExistente){

    const senhaEstaCorreta = criptografia.comparaHash(req.body.senha,usuarioExistente.get('senha'))
      if(senhaEstaCorreta){
       const token = jwt.geraToken(usuarioExistente);
         res.json({
           token: token,
           Usuario: usuarioExistente
     })
   } else{
    res.status(400).json({
      mensagem:'As credencias estão incorretas'
    });
  } 
 } else{
      res.status(400).json({
        mensagem:'As credencias estão incorretas'
      });
    }
  })
  
  function validacaoUsuario (request, response, next) {
  const schema = Joi.object({
    nome: Joi.string().min(1).max(200),
    email: Joi.string().min(1).max(200),
    senha_nova: Joi.string().min(6).max(80),
    senha_atual: Joi.string().min(6).max(80),
  });
  const resultado = schema.validate(request.body);
  if (resultado.error) {
    response.status(400).json(resultado.error);
  } else {
    next();
  }
}
router.put ('/:usuarioId/perfil', validacaoUsuario ,autenticacao,async function(req,res){
  const usuarioExistente = await modelos.Usuario
  .where('id', '=', req.params.usuarioId)
  .fetch();

if (usuarioExistente) {
  if(req.params.usuarioId != req.usuario.get('id')){
    res.status(400).json({
      mensagem : 'Você não tem permissão para alterar este usuário',
    });
    return;
  }
    if(req.body.senha_atual && req.body.senha_nova){
      const senhaEstaCorreta = criptografia.comparaHash(req.body.senha_atual, usuarioExistente.get('senha'))
    if (senhaEstaCorreta){
      usuarioExistente.set("senha",criptografia.geraHash(req.body.senha_nova))
    }else {
      res.status(400).json({
        mensagem: 'A senha atual esta errada',
      });
    }
  }
        usuarioExistente.set('nome',req.body.nome);
        usuarioExistente.set('email',req.body.email);
        const retorno = await usuarioExistente.save();
        res.json(retorno)
     } else{
       res.status(400).json({
         mensagem: ' O usuario não existe',
       });
     }

})


module.exports = router;