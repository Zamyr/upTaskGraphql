const bcryptjs = require('bcryptjs');
const Usuario = require('../models/Usuario');
const Proyecto = require('../models/Proyecto');
const Tarea = require('../models/Tarea');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});

//Crear token (JWT)
const creatToken = (usuario, secreta, expiresIn) => {
	const {id, email} = usuario;
	return jwt.sign({id, email}, secreta, {expiresIn});
};

const resolvers = {
	Query: {
		obtenerProyectos: async (_, {}, ctx) => {
			const proyectos = await Proyecto.find({creador: ctx.usuario.id});
			return proyectos;
		},
		obtenerTareas: async (_, {input}, ctx) => {
			const tareas = await Tarea.find({creador: ctx.usuario.id}).where('proyecto').equals(input.proyecto);

			return tareas;
		},
	},
	Mutation: {
		crearUsuario: async (_, {input}) => {
			const {email, password} = input;

			const existeUsuario = await Usuario.findOne({email});
			if (existeUsuario) throw new Error('El usuario ya esta registrado');

			try {
				//Hashear password
				const salt = await bcryptjs.genSalt(10);
				input.password = await bcryptjs.hash(password, salt);

				const nuevoUsuario = new Usuario(input);
				nuevoUsuario.save();
				return 'Usuario registrado correctamente!';
			} catch (error) {
				console.log(error);
			}
		},

		autenticarUsuario: async (_, {input}) => {
			const {email, password} = input;
			//Existe el usuario
			const existeUsuario = await Usuario.findOne({email});
			if (!existeUsuario) throw new Error('El usuario no existe');

			const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);

			if (!passwordCorrecto) throw new Error('Password es incorrecto');
			return {
				token: creatToken(existeUsuario, process.env.SECRETA, '2hr'),
			};
		},

		nuevoProyecto: async (_, {input}, ctx) => {
			try {
				const proyecto = new Proyecto(input);
				proyecto.creador = ctx.usuario.id;
				const resultado = await proyecto.save();
				return resultado;
			} catch (error) {
				console.log(error);
			}
		},
		actualizarProyecto: async (_, {id, input}, ctx) => {
			//Existe el proyecto
			let proyecto = await Proyecto.findById(id);

			if (!proyecto) throw new Error('No existe el proyecto');

			//Es el creador del proyecto
			if (proyecto.creador.toString() !== ctx.usuario.id) throw new Error('No tienes permiso para editar este proyecto');

			proyecto = await Proyecto.findOneAndUpdate({_id: id}, input, {new: true});
			return proyecto;
		},
		eliminarProyecto: async (_, {id}, ctx) => {
			//Existe el proyecto
			let proyecto = await Proyecto.findById(id);

			if (!proyecto) throw new Error('No existe el proyecto');

			//Es el creador del proyecto
			if (proyecto.creador.toString() !== ctx.usuario.id) throw new Error('No tienes permiso para eliminar este proyecto');

			await Proyecto.findByIdAndDelete({_id: id});
			return 'Proyecto Eliminado';
		},

		nuevaTarea: async (_, {input}, ctx) => {
			try {
				const tarea = await Tarea(input);
				tarea.creador = ctx.usuario.id;

				const resultado = await tarea.save();
				return resultado;
			} catch (error) {
				console.log(error);
			}
		},
		actualizarTarea: async (_, {id, input, estado}, ctx) => {
			//Existe la tarea
			let tarea = await Tarea.findById(id);
			if (!tarea) throw new Error('No existe el tarea');

			//Es el creador del tarea
			if (tarea.creador.toString() !== ctx.usuario.id) throw new Error('No tienes permiso para editar esta tarea');

			input.estado = estado;

			tarea = await Tarea.findOneAndUpdate({_id: id}, input, {new: true});
			return tarea;
		},
		eliminarTarea: async (_, {id}, ctx) => {
			//Existe la tarea
			let tarea = await Tarea.findById(id);
			if (!tarea) throw new Error('No existe el tarea');

			//Es el creador del tarea
			if (tarea.creador.toString() !== ctx.usuario.id) throw new Error('No tienes permiso para eliminar esta tarea');

			//Eliminar tarea
			await Tarea.findOneAndDelete({_id: id});
			return 'Tarea Eliminada';
		},
	},
};

module.exports = resolvers;
