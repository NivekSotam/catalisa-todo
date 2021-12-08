const express = require('express');
const router = express.Router();
const modelos = require('../modelos');
const autenticacao = require('../helpers/autenticacao');
const Joi = require('joi');
const { json } = require('express');

router.get('/', autenticacao, async function(req, res, next) {
  // SELECT * FROM terefas WHERE usuario_id = ?
  const retorno = await modelos.Tarefa
    .where('usuario_id', '=', req.usuario.get('id'))
    .fetchAll();
  res.json(retorno);
});

function validacaoAlteracao(req, res, next) {
  const schema = Joi.object({
    titulo: Joi.string().min(1).max(300),
    concluida: Joi.boolean(),
  });
  const resultado = schema.validate(req.body);
  if (resultado.error) {
    res.status(400).json(resultado.error);
  } else {
    next();
  }
}



router.put('/:id', validacaoAlteracao, autenticacao, async function (req, res, next) {
  // SELECT * FROM tarefas WHERE id = 3 AND usuario_id = 12
 
  const tarefaExistente = await modelos.Tarefa
    .where('id', '=', req.params.id)
    .where('usuario_id', '=', req.usuario.get('id'))
  if (!tarefaExistente) {
    res.status(400).json({
      mensagem: 'A tarefa não existe'
    });
    return;
  }

  tarefaExistente.set('titulo', req.body.titulo);
  tarefaExistente.set('concluida', req.body.concluida);
  const retorno = await tarefaExistente.save();
  res.json(retorno);
});

router.put('/:id/conclusao' , autenticacao, async function (req, res, next) {
  const tarefaExistente = await modelos.Tarefa
    .where('id', '=', req.params.id)
    .where('usuario_id', '=', req.usuario.get('id'))
    .fetch();
  if (!tarefaExistente) {
    res.status(400).json({
      mensagem: 'A tarefa não existe'
    });
    return;
  }

  const concluida = tarefaExistente.get('concluida') === 1;
  if (concluida) {
    tarefaExistente.set('concluida', false);
  } else {
    tarefaExistente.set('concluida', true);
  }

  const retorno = await tarefaExistente.save();
  res.json(retorno);
});
router.delete('/:id', autenticacao, async function (req, res, next) {
  // SELECT * FROM tarefas WHERE id = 3 AND usuario_id = 12
  const tarefaExistente = await modelos.Tarefa
    .where('id', '=', req.params.id)
    .where('usuario_id', '=', req.usuario.get('id'))
    .fetch();
  if (!tarefaExistente) {
    res.status(400).json({
      mensagem: 'A tarefa não existe'
    });
    return;
  }

  await tarefaExistente.destroy();
  res.sendStatus(204);
});

function validacaoCadastro(req, res, next) {
  const schema = Joi.object({
    titulo: Joi.string().min(1).max(300).required(),
    concluida: Joi.boolean().required(),
    categoria_id: Joi.number() ,
  });
  const resultado = schema.validate(req.body);
  if (resultado.error) {
    res.status(400).json(resultado.error);
  } else {
    next();
  }
}


router.post('/', validacaoCadastro, autenticacao, async function(req, res, next) {
  
    const verificarTarefa = await modelos.Tarefa
      .where('titulo', '=', req.body.titulo)
      .where('usuario_id', '=', req.usuario.get('id'))
      .fetch();
      
    if(verificarTarefa){
      res.status(400).json({
        mensagem: 'tarefa já existe'
      })
    }

    const verificarCategoria = await modelos.Categoria
      .where('id', '=', req.body.categoria_id)
      .where('usuario_id', '=', req.usuario.get('id'))
      .fetch();
      
    if(!verificarCategoria){
      res.status(400).json({
        mensagem: 'categoria não existe'
      })
    }

    const tarefa = new modelos.Tarefa({
      titulo: req.body.titulo,
      concluida: req.body.concluida,
      data_criacao: new Date(),
      categoria_id: req.body.categoria_id,
      usuario_id: req.usuario.get('id'),
    });

  const retorno = await tarefa.save();
  res.status(201).json(retorno);
});


function validacaoAlteracaoCategoria(req, res, next) {
  const schema = Joi.object({
    nome: Joi.string().min(1).max(200),
  });
  const resultado = schema.validate(req.body);
  if (resultado.error){
    res.status(400).json(resultado.error);
  } else {
    next();
  }
}

router.post('/categorias', validacaoAlteracaoCategoria, autenticacao, async function (req, res, next) {
  const categoriaExistente = await modelos.Categoria
    .where('nome','=', req.body.nome)
    .fetch()
  if (categoriaExistente) {
    res.status(400).json({
      mensagem: 'Categoria já cadastrada.'
    })

    return;
  }

  const usuarioCategoria = new modelos.Categoria({
    nome: req.body.nome,
    usuario_id: req.usuario.get('id'),
    data_criacao: new Date()
  });

  const retorno = await usuarioCategoria.save();
  res.status(201).json(retorno);
});

router.put('/categorias/:id', validacaoAlteracaoCategoria, autenticacao, async function (req, res, next) {
  const alteracao = await modelos.Categoria
    .where('id', '=', req.params.id)
    .where('usuario_id', '=', req.usuario.get('id'))
    .fetch();
  if (!alteracao) {
    res.status(401).json({
      mensagem: 'Você não tem altorização'
    });
    return;
  }
  alteracao.set({'nome': req.body.nome});

  const retorno = await alteracao.save();
  res.json(retorno);
});

router.put('/:id', autenticacao, validacaoAlteracao, async function (req, res, next) {
  // select * from tarefas where id = 3 and usuario_id = 12
  if(req.body.categoria_id){
    const categoriaExistente = await modelos.Categoria
      .where('id', '=', req.body.categoria_id)
      .where('usuario_id', '=', req.usuario.get('id'))
      .fetch()
    if (!categoriaExistente) {
      res.status(400).json({
        mensagem: 'Categoria não existe'
      })
      return;
  }};
});


// router.delete('/categorias/:id', autenticacao, async function (req, res, next) {
  
//   const categoriaExistente = await modelos.Categoria
//     .where('id', '=', req.params.id)
//     .where('usuario_id', '=', req.usuario.get('id'))
//     .fetch();
//   if (!tarefaExistente) {
//     res.status(400).json({
//       mensagem: 'A tarefa não existe'
//     });
//     return;
//   }

//   await tarefaExistente.destroy();
//   res.sendStatus(204);
// });

module.exports = router;

